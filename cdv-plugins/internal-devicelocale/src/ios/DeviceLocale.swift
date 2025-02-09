// DeviceLocale.swift
import Foundation

@objc(DeviceLocale)
class DeviceLocale : CDVPlugin 
{
    @objc(get:)
    func get(command: CDVInvokedUrlCommand) 
    {
        let country = NSLocale.current.regionCode
        let language = NSLocale.current.languageCode

        let pluginResult = CDVPluginResult(
            status: CDVCommandStatus_OK,
            messageAs: [
                "country": country,
                "language": language
            ]
        )

        self.commandDelegate!.send(
            pluginResult,
            callbackId: command.callbackId
        )
    }
}