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
 * @file index.js
 * @author Samuel Furter <samuel@ethereum.org>
 * @date 2018
 */

"use strict";

import PromiEventPackage from 'web3-core-promievent';
import {MethodController} from 'web3-core-method';
import ProvidersPackage from 'web3-providers';
import {formatters} from 'web3-core-helpers';
import Utils from 'web3-utils';
import {AbiCoder} from 'web3-eth-abi';
import ContractPackageFactory from './factories/ContractPackageFactory';

/**
 * Returns an object of type Contract
 *
 * @method Contract
 *
 * @param {AbstractProviderAdapter|EthereumProvider} provider
 * @param {Accounts} accounts
 * @param {Object} abi
 * @param {String} address
 * @param {Object} options
 *
 * @returns {Contract}
 */
export const Contract = (provider, accounts, abi, address, options) => {
    return new ContractPackageFactory(
        Utils,
        formatters,
        new AbiCoder(),
    accounts
    ).createContract(
        provider,
        ProvidersPackage,
        new MethodController(),
    PromiEventPackage,
    abi,
    address,
    options
    );
};

export ContractDeployMethodModel from './models/methods/ContractDeployMethodModel';
