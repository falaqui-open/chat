// ActiveContacts.swift
@objc(ActiveContacts)
class ActiveContacts : CDVPlugin 
{
    @objc(list:)
    func list(command: CDVInvokedUrlCommand) 
    {
        let result = nil

        let pluginResult = CDVPluginResult(
            status: CDVCommandStatus_OK,
            messageAs: [
                "contacts": result
            ]
        )

        self.commandDelegate!.send(
            pluginResult,
            callbackId: command.callbackId
        )
    }
}