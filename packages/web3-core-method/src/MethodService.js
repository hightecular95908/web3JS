/*
 This file is part of web3.js.

 web3.js is free software: you can redistribute it and/or modify
 it under the terms of the GNU Lesser General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 web3.js is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Lesser General Public License for more details.

 You should have received a copy of the GNU Lesser General Public License
 along with web3.js.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * @file MethodService.js
 * @author Samuel Furter <samuel@ethereum.org>
 * @date 2018
 */

"use strict";

var _ = require('underscore');

/**
 * @param {PromiEvent} promiEventPackage
 * @param {TransactionConfirmationWorkflow} transactionConfirmationWorkflow
 * @param {TransactionSigner} transactionSigner
 * @param {MessageSigner} messageSigner
 *
 * @constructor
 */
function MethodService(
    promiEventPackage,
    transactionConfirmationWorkflow,
    transactionSigner,
    messageSigner
) {
    this.promiEventPackage = promiEventPackage;
    this.transactionConfirmationWorkflow = transactionConfirmationWorkflow;
    this.transactionSigner = transactionSigner;
    this.messageSigner = messageSigner;
}

/**
 * Executes the given method
 *
 * @method execute
 *
 * @param {AbstractMethodModel} methodModel
 * @param {AbstractProviderAdapter} provider
 * @param {Accounts} accounts
 * @param {Object} parentObject - The object from which the method is called.
 * @param {Array} methodArguments
 *
 * @returns {Promise|eventifiedPromise|String|boolean}
 */
MethodService.prototype.execute = function (methodModel, provider, accounts, parentObject, methodArguments) {
    var mappedFunctionArguments = this.mapFunctionArguments(methodArguments);

    methodModel.beforeExecution(mappedFunctionArguments.parameters, parentObject);

    return this.send(
        methodModel,
        provider,
        accounts,
        mappedFunctionArguments.parameters,
        mappedFunctionArguments.callback
    );
};

/**
 * Sends the JSON-RPC request
 *
 * @method send
 *
 * @callback callback callback(error, result)
 * @returns {Promise | eventifiedPromise | String | boolean}
 */
MethodService.prototype.send = function (methodModel, provider, accounts, parameters, callback) {
    var self = this;
    var promiEvent = this.promiEventPackage.createPromiEvent();

    if (accounts && accounts.wallet.length > 0) {
        if (this.methodModel.isSign()) {
            return this.messageSigner.sign(parameters[0], parameters[1], accounts);
        }

        if (this.methodModel.isSendTransaction()) {
            this.methodModel.rpcMethod = 'eth_sendRawTransaction';
            this.transactionSigner.sign(parameters[0], accounts).then(function(response) {
                self.sendTransaction(
                    methodModel,
                    provider,
                    promiEvent,
                    [response.rawTransaction],
                    null,
                    callback
                );
            }).catch(function(error) {
                promiEvent.reject(error);
                promiEvent.on('error', error);
                promiEvent.eventEmitter.removeAllListeners();
                callback(error, null);
            });

            return promiEvent;
        }
    }

    if (this.methodModel.isSendTransaction() || this.methodModel.isSendRawTransaction()) {
        if (this.isGasPriceDefined()) {
            return this.sendTransaction(
                methodModel,
                provider,
                promiEvent,
                parameters,
                null,
                callback
            );
        }

        this.getGasPrice().then(function (gasPrice) {
            self.sendTransaction(
                methodModel,
                provider,
                promiEvent,
                parameters,
                gasPrice,
                callback
            )
        });

        return promiEvent;
    }

    return this.call(methodModel, provider, parameters, callback);
};

/**
 * Determines if gasPrice is defined in the method options
 *
 * @method isGasPriceDefined
 *
 * @returns {boolean}
 */
MethodService.prototype.isGasPriceDefined = function () {
    return _.isObject(this.parameters[0]) && typeof this.parameters[0].gasPrice !== 'undefined';
};

/**
 * Sends a JSON-RPC call request
 *
 * @method call
 *
 * @param {AbstractMethodModel} methodModel
 * @param {AbstractProviderAdapter} provider
 * @param {Array} parameters
 * @param {Function} callback
 *
 * @callback callback callback(error, result)
 * @returns {Promise}
 */
MethodService.prototype.call = function (methodModel, provider, parameters, callback) {
    return provider.send(
        methodModel.rpcMethod,
        parameters
    ).then(function (response) {
        var mappedResponse = methodModel.afterExecution(response);
        callback(mappedResponse);

        return mappedResponse;
    });
};

/**
 * Returns the mapped function arguments
 *
 * @method mapFunctionArguments
 *
 * @param {IArguments} args
 *
 * @returns {Object}
 */
MethodService.prototype.mapFunctionArguments = function (args) {
    var parameters = args;
    var callback = null;

    if (arguments.length < this.parametersAmount) {
        throw new Error(
            'Arguments length is not correct: expected: ' + this.parametersAmount + ', given: ' + arguments.length
        );
    }

    if (arguments.length > this.parametersAmount) {
        callback = arguments.slice(-1);
        if(!_.isFunction(callback)) {
            throw new Error(
                'The latest parameter should be a function otherwise it can not be used as callback'
            );
        }
        parameters = arguments.slice(0, -1);
    }

    return {
        callback: callback,
        parameters: parameters
    }
};


/**
 * Sends the JSON-RPC sendTransaction request
 *
 * @method sendTransaction
 *
 * @param {AbstractMethodModel} methodModel
 * @param {AbstractProviderAdapter} provider
 * @param {PromiEvent} promiEvent
 * @param {Array} parameters
 * @param {String} gasPrice
 * @param {Function} callback
 *
 * @callback callback callback(error, result)
 * @returns {eventifiedPromise}
 */
MethodService.prototype.sendTransaction = function (methodModel, provider, promiEvent, parameters, gasPrice, callback) {
    var self = this;

    if (gasPrice && _.isObject(parameters[0])) {
        parameters[0].gasPrice = gasPrice;
    }

    provider.send(
        methodModel.rpcMethod,
        parameters
    ).then(function (response) {
        self.transactionConfirmationWorkflow.execute(
            methodModel,
            provider,
            response,
            promiEvent,
            callback
        );

        promiEvent.eventEmitter.emit('transactionHash', response)
    }).catch(function (error) {
        promiEvent.reject(error);
        promiEvent.on('error', error);
        promiEvent.eventEmitter.removeAllListeners();
    });

    return promiEvent;
};

module.exports = MethodService;
