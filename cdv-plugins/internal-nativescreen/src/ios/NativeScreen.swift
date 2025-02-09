// NativeScreen.swift
import Foundation
import Contacts

@objc(NativeScreen)
class NativeScreen : CDVPlugin 
{
    @objc(showNativeScreen:)
    func showNativeScreen(command: CDVInvokedUrlCommand) 
    {
        let message = command.arguments[0] as? String ?? ""

        DispatchQueue.main.async {
            // Retrieve parameters sent from JavaScript
            let message = command.argument(at: 0) as? String ?? "Default Message"

            // Create and present the native screen
            let nativeScreenVC = NativeScreenViewController()
            nativeScreenVC.message = message
            nativeScreenVC.plugin = self
            nativeScreenVC.callbackId = command.callbackId

            self.viewController?.present(nativeScreenVC, animated: true, completion: nil)
        }

        let pluginResult = CDVPluginResult(
            status: CDVCommandStatus_OK,
            messageAs: [
                "message": message
            ]
        )

        self.commandDelegate!.send(
            pluginResult,
            callbackId: command.callbackId
        )
    }


    @objc(showNativeContactList:)
    func showNativeContactList(command: CDVInvokedUrlCommand) 
    {
        let status = CNContactStore.authorizationStatus(for: .contacts)

        switch status {
        case .authorized:
            presentContactListViewController(command: command)
        case .notDetermined:
            requestContactsAccess(command: command)
        case .denied, .restricted:
            let pluginResult = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: "Permission denied to access contacts")
            self.commandDelegate!.send(pluginResult, callbackId: command.callbackId)
        @unknown default:
            let pluginResult = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: "Unknown authorization status")
            self.commandDelegate!.send(pluginResult, callbackId: command.callbackId)
        }
    }
    

    @objc(showNativeContactListSelection:)
    func showNativeContactListSelection(command: CDVInvokedUrlCommand) 
    {
        let status = CNContactStore.authorizationStatus(for: .contacts)

        switch status {
        case .authorized:
            presentContactListSelectionViewController(command: command)
        case .notDetermined:
            requestContactsAccess(command: command)
        case .denied, .restricted:
            let pluginResult = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: "Permission denied to access contacts")
            self.commandDelegate!.send(pluginResult, callbackId: command.callbackId)
        @unknown default:
            let pluginResult = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: "Unknown authorization status")
            self.commandDelegate!.send(pluginResult, callbackId: command.callbackId)
        }
    }

    private func requestContactsAccess(command: CDVInvokedUrlCommand) {
        let store = CNContactStore()

        store.requestAccess(for: .contacts) { granted, error in
            DispatchQueue.main.async {
                if granted {
                    self.presentContactListViewController(command: command)
                } else {
                    let pluginResult = CDVPluginResult(status: CDVCommandStatus_ERROR, messageAs: "Permission denied to access contacts")
                    self.commandDelegate!.send(pluginResult, callbackId: command.callbackId)
                }
            }
        }
    }

    private func presentContactListViewController(command: CDVInvokedUrlCommand) 
    {
        let screenTitle = command.arguments[0] as? String ?? "";
        let searchBoxText = command.arguments[1] as? String ?? "";
        let onlyMobileText = command.arguments[2] as? String ?? "";
        let contactsText = command.arguments[3] as? String ?? "";
        let createNewButtonText = command.arguments[4] as? String ?? "";
        let createGroupButtonText = command.arguments[5] as? String ?? "";

        DispatchQueue.main.async {
            let nativeContactListVC = NativeContactListViewController()
            nativeContactListVC.plugin = self
            nativeContactListVC.callbackId = command.callbackId
            nativeContactListVC.screenTitle = screenTitle
            nativeContactListVC.searchBoxText = searchBoxText
            nativeContactListVC.onlyMobileText = onlyMobileText
            nativeContactListVC.contactsText = contactsText
            nativeContactListVC.createNewButtonText = createNewButtonText
            nativeContactListVC.createGroupButtonText = createGroupButtonText

            self.viewController?.present(nativeContactListVC, animated: true, completion: nil)
        }
    }

    private func presentContactListSelectionViewController(command: CDVInvokedUrlCommand) 
    {
        let preSelectionArray = command.arguments[0] as? [String] ?? []
        let screenTitle = command.arguments[1] as? String ?? "";
        let searchBoxText = command.arguments[2] as? String ?? "";
        let onlyMobileText = command.arguments[3] as? String ?? "";
        let addButtonText = command.arguments[4] as? String ?? "";
        let contactsText = command.arguments[5] as? String ?? "";

        DispatchQueue.main.async {
            // Dismiss any existing modals
            self.dismissExistingViewControllersIfNeeded()
            
            let nativeContactListSelectionVC = NativeContactListSelectionViewController()
            nativeContactListSelectionVC.plugin = self
            nativeContactListSelectionVC.callbackId = command.callbackId
            nativeContactListSelectionVC.preSelectionArray = preSelectionArray
            nativeContactListSelectionVC.screenTitle = screenTitle
            nativeContactListSelectionVC.searchBoxText = searchBoxText
            nativeContactListSelectionVC.onlyMobileText = onlyMobileText
            nativeContactListSelectionVC.addButtonText = addButtonText
            nativeContactListSelectionVC.contactsText = contactsText

            // self.viewController?.present(nativeContactListSelectionVC, animated: true, completion: nil)
            
            // Ensure presentation from the top-most view controller
            guard let topViewController = self.topMostViewController() else { return }
            topViewController.present(nativeContactListSelectionVC, animated: true, completion: nil)
        }
    }
    
    // Helper function to find the top-most view controller
    private func topMostViewController() -> UIViewController? {
        var topController = UIApplication.shared.keyWindow?.rootViewController
        while let presentedViewController = topController?.presentedViewController {
            topController = presentedViewController
        }
        return topController
    }
    
    private func dismissExistingViewControllersIfNeeded() {
        guard let topController = topMostViewController() else { return }
        if topController.presentedViewController != nil {
            topController.dismiss(animated: false)
        }
    }


    @objc(closeNativeScreen:)
    func closeNativeScreen(command: CDVInvokedUrlCommand) {
        DispatchQueue.main.async {
            self.viewController?.dismiss(animated: true, completion: nil)
        }
    }
}
