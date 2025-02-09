import UIKit

class NativeScreenViewController: UIViewController {
    var message: String = "Hello, Native Screen!"
    var plugin: NativeScreen?
    var callbackId: String?

    override func viewDidLoad() {
        super.viewDidLoad()

        // Configure the view
        view.backgroundColor = .white

        // Create and configure a label
        let label = UILabel()
        label.text = message
        label.textAlignment = .center
        label.numberOfLines = 0
        label.frame = CGRect(x: 20, y: 100, width: view.frame.width - 40, height: 100)
        view.addSubview(label)

        // Create and configure a close button
        let button = UIButton(type: .system)
        button.setTitle("Close", for: .normal)
        button.frame = CGRect(x: (view.frame.width - 100) / 2, y: 250, width: 100, height: 50)
        button.addTarget(self, action: #selector(closeButtonTapped), for: .touchUpInside)
        view.addSubview(button)
    }

    @objc func closeButtonTapped() {
        // Send callback to JavaScript
        if let callbackId = callbackId {
            let result = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: "Data from iOS native screen")
            plugin?.commandDelegate.send(result, callbackId: callbackId)
        }

        // Dismiss the native screen
        dismiss(animated: true, completion: nil)
    }
}