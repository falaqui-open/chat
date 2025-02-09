import UIKit
import Contacts

class NativeContactListViewController: UIViewController, UITableViewDataSource, UITableViewDelegate, UISearchBarDelegate {
    public var allContacts: [(String, [CNLabeledValue<CNPhoneNumber>])] = []
    public var filteredContacts: [(String, [CNLabeledValue<CNPhoneNumber>])] = []
    public var plugin: NativeScreen?
    public var callbackId: String?
    public var screenTitle: String?
    public var searchBoxText: String?
    public var onlyMobileText: String?
    public var contactsText: String?
    public var createNewButtonText: String?
    public var createGroupButtonText: String?
    
    private lazy var closeButton: UIButton = {
        let button = UIButton(type: .system)
        if #available(iOS 13.0, *) {
            button.setImage(UIImage(systemName: "xmark"), for: .normal)
        } else {
            button.setImage(UIImage(named: "xmark"), for: .normal) // Use a custom image in your assets
        }
        
        button.addTarget(self, action: #selector(closeTapped), for: .touchUpInside)
        return button
    }()
    
    private lazy var titleLabel: UILabel = {
        let label = UILabel()
        label.text = "Your phone contact list"
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
    
    private lazy var createNewButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("Create New", for: .normal)
        button.setTitleColor(.white, for: .normal)
        button.backgroundColor = .systemBlue
        button.layer.cornerRadius = 8
        button.addTarget(self, action: #selector(createNewTapped), for: .touchUpInside)
        return button
    }()

    private lazy var createGroupButton: UIButton = {
        let button = UIButton(type: .system)
        button.setTitle("Create Group", for: .normal)
        button.setTitleColor(.white, for: .normal)
        button.backgroundColor = .systemGreen
        button.layer.cornerRadius = 8
        button.addTarget(self, action: #selector(createGroupTapped), for: .touchUpInside)
        return button
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
    
    override func viewDidLoad() {
        super.viewDidLoad()
        if #available(iOS 13.0, *) {
            view.backgroundColor = .systemBackground
        } else {
            view.backgroundColor = .white
        }
        setupUI()
        requestContactsAccess()
    }
    
    private func setupUI() {
        titleLabel.text = screenTitle
        searchBar.placeholder = searchBoxText
        mobileOnlyLabel.text = onlyMobileText
        createNewButton.setTitle(createNewButtonText, for: .normal)
        createGroupButton.setTitle(createGroupButtonText, for: .normal)

        view.addSubview(closeButton)
        view.addSubview(titleLabel)
        view.addSubview(countLabel)
        view.addSubview(createNewButton)
        view.addSubview(createGroupButton)
        view.addSubview(searchBar)
        view.addSubview(mobileOnlySwitch)
        view.addSubview(mobileOnlyLabel)
        view.addSubview(tableView)
        
        // Setup constraints
        closeButton.translatesAutoresizingMaskIntoConstraints = false
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        countLabel.translatesAutoresizingMaskIntoConstraints = false
        createNewButton.translatesAutoresizingMaskIntoConstraints = false
        createGroupButton.translatesAutoresizingMaskIntoConstraints = false
        searchBar.translatesAutoresizingMaskIntoConstraints = false
        mobileOnlySwitch.translatesAutoresizingMaskIntoConstraints = false
        mobileOnlyLabel.translatesAutoresizingMaskIntoConstraints = false
        tableView.translatesAutoresizingMaskIntoConstraints = false
        
        NSLayoutConstraint.activate([
            closeButton.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
            closeButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
            
            titleLabel.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 16),
            titleLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            
            countLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 8),
            countLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            
            createNewButton.topAnchor.constraint(equalTo: countLabel.bottomAnchor, constant: 16),
            createNewButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
            createNewButton.trailingAnchor.constraint(equalTo: view.centerXAnchor, constant: -8),
            createNewButton.heightAnchor.constraint(equalToConstant: 40),
            
            createGroupButton.topAnchor.constraint(equalTo: countLabel.bottomAnchor, constant: 16),
            createGroupButton.leadingAnchor.constraint(equalTo: view.centerXAnchor, constant: 8),
            createGroupButton.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
            createGroupButton.heightAnchor.constraint(equalToConstant: 40),
            
            searchBar.topAnchor.constraint(equalTo: createNewButton.bottomAnchor, constant: 16),
            searchBar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            searchBar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            
            mobileOnlyLabel.topAnchor.constraint(equalTo: searchBar.bottomAnchor, constant: 16),
            mobileOnlyLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
            
            mobileOnlySwitch.centerYAnchor.constraint(equalTo: mobileOnlyLabel.centerYAnchor),
            mobileOnlySwitch.leadingAnchor.constraint(equalTo: mobileOnlyLabel.trailingAnchor, constant: 8),
            
            tableView.topAnchor.constraint(equalTo: mobileOnlyLabel.bottomAnchor, constant: 16),
            tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tableView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor)
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
        } catch {
            print("Error fetching contacts: \(error)")
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
    
    private func returnContact(name: String, phone: CNLabeledValue<CNPhoneNumber>) {
        let result: [String: Any] = ["message": 
            [
                "name": name,
                "phone": phone.value.stringValue,
                "type": phone.label?.replacingOccurrences(of: "_$!<", with: "")
                    .replacingOccurrences(of: ">!$_", with: "")
                    .uppercased() ?? "OTHER"
            ]
        ]
        
        // if let jsonData = try? JSONSerialization.data(withJSONObject: result),
        //    let jsonString = String(data: jsonData, encoding: .utf8) {
        //     let pluginResult = CDVPluginResult(
        //         status: CDVCommandStatus_OK,
        //         messageAs: jsonString
        //     )
        //     plugin?.commandDelegate?.send(pluginResult, callbackId: callbackId)
        // }
        
        // dismiss(animated: true)
        sendPluginResult(result: result)
    }
    
    // MARK: - Actions
    
    @objc private func closeTapped() {
        dismiss(animated: true)
    }
    
    @objc private func mobileOnlySwitchChanged() {
        filterContacts()
    }
    

    @objc private func createNewTapped() {
        let result: [String: Any] = ["message": ["action": "CREATE_NEW"]]
        sendPluginResult(result: result)
    }

    @objc private func createGroupTapped() {
        let result: [String: Any] = ["message": ["action": "CREATE_GROUP"]]
        sendPluginResult(result: result)
    }

    // MARK: - UITableViewDataSource
    
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return filteredContacts.count
    }
    
    // Updated table view cell configuration:
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "ContactCell", for: indexPath)
        let (name, phones) = filteredContacts[indexPath.row]
        
        if #available(iOS 14.0, *) {
            var content = cell.defaultContentConfiguration()
            content.text = name
            content.secondaryText = phones.map { phone in
                let label = phone.label?.replacingOccurrences(of: "_$!<", with: "")
                    .replacingOccurrences(of: ">!$_", with: "")
                    .uppercased() ?? "OTHER"
                return "\(phone.value.stringValue) (\(label))"
            }.joined(separator: "\n")
            cell.contentConfiguration = content
        } else {
            cell.textLabel?.text = name
            cell.detailTextLabel?.numberOfLines = 0
            cell.detailTextLabel?.text = phones.map { phone in
                let label = phone.label?.replacingOccurrences(of: "_$!<", with: "")
                    .replacingOccurrences(of: ">!$_", with: "")
                    .uppercased() ?? "OTHER"
                return "\(phone.value.stringValue) (\(label))"
            }.joined(separator: "\n")
        }
        return cell
    }
    
    // MARK: - UITableViewDelegate
    
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        let (name, phones) = filteredContacts[indexPath.row]
        if let firstPhone = phones.first {
            returnContact(name: name, phone: firstPhone)
        }
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
}
