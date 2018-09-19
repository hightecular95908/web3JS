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
 * @file GetStorageAtMethodModel.js
 * @author Samuel Furter <samuel@ethereum.org>
 * @date 2018
 */

"use strict";

var AbstractMethodModel = require('../../lib/models/AbstractMethodModel');

/**
 * @param {Utils} utils
 * @param {Object} formatters
 *
 * @constructor
 */
function GetStorageAtMethodModel(utils, formatters) {
    AbstractMethodModel.call(
        this,
        'eth_getStorageAt',
        3,
        [
            formatters.inputAddressFormatter,
            utils.numberToHex,
            formatters.inputDefaultBlockNumberFormatter
        ],
        null
    );
}

/**
 * This method will be executed before the effective execution.
 *
 * @method beforeExecution
 *
 * @param {Array} parameters
 * @param {Object} parentObject
 */
GetStorageAtMethodModel.prototype.beforeExecution = function (parameters, parentObject) {
    if (!parameters[2]) {
        parameters[2] = parentObject.defaultBlock;
    }
};

GetStorageAtMethodModel.prototype = Object.create(AbstractMethodModel.prototype);

module.exports = GetStorageAtMethodModel;
