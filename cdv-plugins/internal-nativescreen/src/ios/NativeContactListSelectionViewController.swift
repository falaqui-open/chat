import UIKit
import Contacts

class NativeContactListSelectionViewController: UIViewController, UITableViewDataSource, UITableViewDelegate, UISearchBarDelegate {
    
    // MARK: - Properties
    var allContacts: [(String, [CNLabeledValue<CNPhoneNumber>])] = []
    var filteredContacts: [(String, [CNLabeledValue<CNPhoneNumber>])] = []
    var selectedNumbers: [String] = []
    public var plugin: NativeScreen?
    public var callbackId: String?
    var screenTitle: String?
    var searchBoxText: String?
    var onlyMobileText: String?
    var addButtonText: String?
    var contactsText: String?
    var preSelectionArray: [String] = [] // This holds the phone numbers passed to pre-select contacts
    var selectedContacts: Set<IndexPath> = [] // Keeps track of selected rows
    
    private lazy var closeButton: UIButton = {
        let button = UIButton(type: .system)
        if #available(iOS 13.0, *) {
            button.setImage(UIImage(systemName: "xmark"), for: .normal)
        } else {
            button.setImage(UIImage(named: "xmark"), for: .normal)
        }
        button.addTarget(self, action: #selector(closeTapped), for: .touchUpInside)
        return button
    }()
    
    private lazy var titleLabel: UILabel = {
        let label = UILabel()
        label.textAlignment = .center
        label.font = .boldSystemFont(ofSize: 20)
        return label
    }()
    
    private lazy var countLabel: UILabel = {
        let label = UILabel()
        label.textAlignment = .center
        label.font = .systemFont(ofSize: 14)
        return label
    }()
    
    private lazy var searchBar: UISearchBar = {
        let searchBar = UISearchBar()
        searchBar.placeholder = "Type here to search..."
        searchBar.delegate = self
        return searchBar
    }()
    
    private lazy var mobileOnlySwitch: UISwitch = {
        let switch_ = UISwitch()
        switch_.addTarget(self, action: #selector(mobileOnlySwitchChanged), for: .valueChanged)
        return switch_
    }()
    
    private lazy var mobileOnlyLabel: UILabel = {
        let label = UILabel()
        label.text = "Only Mobile Numbers"
        return label
    }()
    
    private lazy var tableView: UITableView = {
        let table = UITableView()
        table.dataSource = self
        table.delegate = self
        table.register(UITableViewCell.self, forCellReuseIdentifier: "ContactCell")
        return table
    }()
    
    private lazy var addButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("Add", for: .normal)
        button.setTitleColor(.white, for: .normal)
        button.backgroundColor = .systemGreen
        button.layer.cornerRadius = 8
        button.addTarget(self, action: #selector(addTapped), for: .touchUpInside)
        return button
    }()
    
    // MARK: - Lifecycle Methods
    override func viewDidLoad() {
        super.viewDidLoad()
        modalPresentationStyle = .overFullScreen // Ensure it layers above the webview
        if #available(iOS 13.0, *) {
            view.backgroundColor = .systemBackground
        } else {
            view.backgroundColor = .white
        }
        setupUI()
        updateAddButtonVisibility() // Initial state
        requestContactsAccess()
    }
    
    private func setupUI() {
        titleLabel.text = screenTitle
        searchBar.placeholder = searchBoxText
        mobileOnlyLabel.text = onlyMobileText
        addButton.setTitle(addButtonText, for: .normal)
        
        view.addSubview(closeButton)
        view.addSubview(titleLabel)
        view.addSubview(countLabel)
        view.addSubview(searchBar)
        view.addSubview(mobileOnlySwitch)
        view.addSubview(mobileOnlyLabel)
        view.addSubview(tableView)
        view.addSubview(addButton)
        
        // Disable autoresizing mask translation
        closeButton.translatesAutoresizingMaskIntoConstraints = false
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        countLabel.translatesAutoresizingMaskIntoConstraints = false
        searchBar.translatesAutoresizingMaskIntoConstraints = false
        mobileOnlySwitch.translatesAutoresizingMaskIntoConstraints = false
        mobileOnlyLabel.translatesAutoresizingMaskIntoConstraints = false
        tableView.translatesAutoresizingMaskIntoConstraints = false
        addButton.translatesAutoresizingMaskIntoConstraints = false
        
        // Define constraints
        NSLayoutConstraint.activate([
            // Close button (top-left corner)
            closeButton.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 10),
            closeButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 10),
            
            // Title label (centered at the top)
            titleLabel.topAnchor.constraint(equalTo: closeButton.topAnchor),
            titleLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            
            // Contact count label (below title)
            countLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 10),
            countLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            
            // Search bar (below count label)
            searchBar.topAnchor.constraint(equalTo: countLabel.bottomAnchor, constant: 10),
            searchBar.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 10),
            searchBar.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -10),
            
            // Mobile-only switch (below search bar, left)
            mobileOnlySwitch.topAnchor.constraint(equalTo: searchBar.bottomAnchor, constant: 10),
            mobileOnlySwitch.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 10),
            
            // Mobile-only label (to the right of the switch)
            mobileOnlyLabel.centerYAnchor.constraint(equalTo: mobileOnlySwitch.centerYAnchor),
            mobileOnlyLabel.leadingAnchor.constraint(equalTo: mobileOnlySwitch.trailingAnchor, constant: 10),
            
            // Table view (fills most of the screen, below mobile-only switch)
            tableView.topAnchor.constraint(equalTo: mobileOnlySwitch.bottomAnchor, constant: 10),
            tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tableView.bottomAnchor.constraint(equalTo: addButton.topAnchor, constant: -10),
            
            // Add button (bottom-center of the screen)
            addButton.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -10),
            addButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            addButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
            addButton.heightAnchor.constraint(equalToConstant: 40),
        ])
    }
    
    private func requestContactsAccess() {
        let store = CNContactStore()
        store.requestAccess(for: .contacts) { [weak self] granted, error in
            if granted {
                DispatchQueue.main.async {
                    self?.loadContacts()
                }
            } else {
                DispatchQueue.main.async {
                    self?.showAccessDeniedAlert()
                }
            }
        }
    }
    
    private func loadContacts() {
        let store = CNContactStore()
        let keysToFetch = [
            CNContactGivenNameKey,
            CNContactFamilyNameKey,
            CNContactPhoneNumbersKey
        ] as [CNKeyDescriptor]
        
        let fetchRequest = CNContactFetchRequest(keysToFetch: keysToFetch)
        fetchRequest.sortOrder = .givenName
        
        do {
            try store.enumerateContacts(with: fetchRequest) { contact, _ in
                if !contact.phoneNumbers.isEmpty {
                    let name = "\(contact.givenName) \(contact.familyName)".trimmingCharacters(in: .whitespaces)
                    self.allContacts.append((name, contact.phoneNumbers))
                }
            }
            filterContacts()
            preSelectContacts() // Call preSelectContacts after loading the contacts
        } catch {
            print("Error fetching contacts: \(error)")
        }
    }
    
    private func preSelectContacts() {
        for (index, contact) in filteredContacts.enumerated() {
            for phone in contact.1 {
                let phoneNumber = phone.value.stringValue.filter { "0123456789".contains($0) }
                
                // If the phone number matches any number in preSelectionArray, select it
                if preSelectionArray.contains(phoneNumber) {
                    let indexPath = IndexPath(row: index, section: 0)
                    selectedContacts.insert(indexPath)
                    if !selectedNumbers.contains(phoneNumber) {
                        selectedNumbers.append(phoneNumber)
                    }
                }
            }
        }

        updateAddButtonVisibility() // Update button visibility after pre-selection
        tableView.reloadData() // Refresh to reflect pre-selection
    }
    
    private func selectContact(_ name: String, phoneNumber: String) {
        if !selectedNumbers.contains(phoneNumber) {
            selectedNumbers.append(phoneNumber)
        }
    }
    
    private func filterContacts() {
        let searchText = searchBar.text?.lowercased() ?? ""
        let mobileOnly = mobileOnlySwitch.isOn
        
        filteredContacts = allContacts.filter { name, phones in
            let matchesSearch = searchText.isEmpty ||
                name.lowercased().contains(searchText) ||
                phones.contains { $0.value.stringValue.lowercased().contains(searchText) }
            
            let matchesMobileOnly = !mobileOnly ||
                phones.contains { $0.label == CNLabelPhoneNumberMobile }
            
            return matchesSearch && matchesMobileOnly
        }
        
        updateAddButtonVisibility() // Ensure button reflects current state
        updateContactCount()
        tableView.reloadData()
    }
    
    private func updateContactCount() {
        countLabel.text = "\(filteredContacts.count) \(contactsText ?? "contacts")"
    }
    
    private func showAccessDeniedAlert() {
        let alert = UIAlertController(
            title: "Access Denied",
            message: "Please enable access to contacts in Settings",
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "OK", style: .default) { [weak self] _ in
            self?.dismiss(animated: true)
        })
        present(alert, animated: true)
    }
    
    @objc private func closeTapped() {
        dismiss(animated: true)
    }
    
    @objc private func mobileOnlySwitchChanged() {
        filterContacts()
    }
    
    @objc private func addTapped() {
        // Prepare an array of cleaned phone numbers (only digits)
        let cleanedNumbers = selectedNumbers.map { number in
            number.filter { "0123456789".contains($0) } // Keep only numeric characters
        }
        
        // Prepare the result as a dictionary with a single array of numbers
        let result: [String: Any] = ["message": cleanedNumbers]
        
        // Send the plugin result with the array of cleaned numbers
        sendPluginResult(result: result)
    }
    
    // MARK: - UITableViewDataSource
    
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return filteredContacts.count
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "ContactCell", for: indexPath)
        let (name, phones) = filteredContacts[indexPath.row]

        if #available(iOS 14.0, *) {
            var content = cell.defaultContentConfiguration()
            content.text = name
            content.secondaryText = phones.map { phone in
                let label = CNLabeledValue<NSString>.localizedString(forLabel: phone.label ?? "OTHER")
                return "\(phone.value.stringValue) (\(label))"
            }.joined(separator: "\n")
            cell.contentConfiguration = content
        } else {
            cell.textLabel?.text = name
            cell.detailTextLabel?.text = phones.map { phone in
                let label = CNLabeledValue<NSString>.localizedString(forLabel: phone.label ?? "OTHER")
                return "\(phone.value.stringValue) (\(label))"
            }.joined(separator: "\n")
        }

        // Show checkmark if the row is selected
        cell.accessoryType = selectedContacts.contains(indexPath) ? .checkmark : .none

        return cell
    }
    
    // MARK: - UITableViewDelegate
    
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        let (name, phones) = filteredContacts[indexPath.row]
        if let firstPhone = phones.first {
            let phoneNumber = firstPhone.value.stringValue
            
            // Toggle selection state
            if selectedContacts.contains(indexPath) {
                selectedContacts.remove(indexPath) // Deselect
                if let index = selectedNumbers.firstIndex(of: phoneNumber) {
                    selectedNumbers.remove(at: index)
                }
            } else {
                selectedContacts.insert(indexPath) // Select
                selectedNumbers.append(phoneNumber)
            }
        }

        updateAddButtonVisibility() // Update button visibility

        // Reload the row to reflect the change visually
        tableView.reloadRows(at: [indexPath], with: .automatic)
    }
    
    func tableView(_ tableView: UITableView, didDeselectRowAt indexPath: IndexPath) {
        if selectedContacts.contains(indexPath) {
            selectedContacts.remove(indexPath)
            let (_, phones) = filteredContacts[indexPath.row]
            if let phoneNumber = phones.first?.value.stringValue {
                if let index = selectedNumbers.firstIndex(of: phoneNumber) {
                    selectedNumbers.remove(at: index)
                }
            }
        }

        updateAddButtonVisibility() // Update button visibility

        tableView.reloadRows(at: [indexPath], with: .automatic)
    }
    
    // MARK: - UISearchBarDelegate
    
    func searchBar(_ searchBar: UISearchBar, textDidChange searchText: String) {
        filterContacts()
    }
    
    func searchBarSearchButtonClicked(_ searchBar: UISearchBar) {
        searchBar.resignFirstResponder()
    }

    private func sendPluginResult(result: [String: Any]) {
        if let jsonData = try? JSONSerialization.data(withJSONObject: result),
        let jsonString = String(data: jsonData, encoding: .utf8) {

            let pluginResult = CDVPluginResult(
                status: CDVCommandStatus_OK,
                messageAs: jsonString
            )

            plugin?.commandDelegate?.send(pluginResult, callbackId: callbackId)
        }
        dismiss(animated: true)
    }

    private func updateAddButtonVisibility() {
        addButton.isHidden = selectedNumbers.isEmpty
    }
}
