/*
 * LiskHQ/lisk-commander
 * Copyright © 2019 Lisk Foundation
 *
 * See the LICENSE file at the top-level directory of this distribution
 * for licensing information.
 *
 * Unless otherwise agreed in a custom licensing agreement with the Lisk Foundation,
 * no part of this software, including this file, may be copied, modified,
 * propagated, or distributed except according to the terms contained in the
 * LICENSE file.
 *
 * Removal or modification of this copyright notice is prohibited.
 *
 */
import { expect, test } from '@oclif/test';
import * as transactions from '@liskhq/lisk-transactions';
import * as validator from '@liskhq/lisk-validator';
import * as config from '../../../../src/utils/config';
import * as printUtils from '../../../../src/utils/print';
import * as inputUtils from '../../../../src/utils/input';

describe('transaction:create:multisignature', () => {
	const defaultLifetime = '24';
	const defaultMinimum = '2';
	const defaultKeysgroup = [
		'215b667a32a5cd51a94c9c2046c11fffb08c65748febec099451e3b164452bca',
		'922fbfdd596fa78269bbcadc67ec2a1cc15fc929a19c462169568d7a3df1a1aa',
	];
	const defaultInputs = {
		passphrase: '123',
		secondPassphrase: '456',
	};
	const defaultTransaction = {
		amount: '10000000000',
		recipientId: '123L',
		senderPublicKey: null,
		timestamp: 66492418,
		type: 4,
		fee: '10000000',
		recipientPublicKey: null,
		asset: {},
	};
	const testnetNetworkIdentifier =
		'e48feb88db5b5cf5ad71d93cdcd1d879b6d5ed187a36b0002cc34e0ef9883255';
	const printMethodStub = sandbox.stub();

	const setupTest = () =>
		test
			.stub(printUtils, 'print', sandbox.stub().returns(printMethodStub))
			.stub(
				config,
				'getConfig',
				sandbox.stub().returns({ api: { network: 'test' } }),
			)
			.stub(
				transactions,
				'registerMultisignature',
				sandbox.stub().returns(defaultTransaction),
			)
			.stub(validator, 'validatePublicKeys', sandbox.stub().returns(true))
			.stub(
				inputUtils,
				'getInputsFromSources',
				sandbox.stub().resolves(defaultInputs),
			)
			.stdout();

	describe('transaction:create:multisignature', () => {
		setupTest()
			.command(['transaction:create:multisignature'])
			.catch(error => {
				return expect(error.message).to.contain('Missing 3 required args');
			})
			.it('should throw an error');
	});

	describe('transaction:create:multisignature lifetime', () => {
		setupTest()
			.command(['transaction:create:multisignature', defaultLifetime])
			.catch(error => {
				return expect(error.message).to.contain('Missing 2 required args');
			})
			.it('should throw an error');
	});

	describe('transaction:create:multisignature lifetime minimum', () => {
		setupTest()
			.command([
				'transaction:create:multisignature',
				defaultLifetime,
				defaultMinimum,
			])
			.catch(error => {
				return expect(error.message).to.contain('Missing 1 required arg');
			})
			.it('should throw an error');
	});

	describe('transaction:create:multisignature lifetime minimum keysgroup', () => {
		setupTest()
			.command([
				'transaction:create:multisignature',
				'life',
				defaultMinimum,
				defaultKeysgroup.join(','),
			])
			.catch(error => {
				return expect(error.message).to.contain('Lifetime must be an integer.');
			})
			.it('should throw an error when lifetime is not integer');

		setupTest()
			.command([
				'transaction:create:multisignature',
				defaultLifetime,
				'minimum',
				defaultKeysgroup.join(','),
			])
			.catch(error => {
				return expect(error.message).to.contain(
					'Minimum number of signatures must be an integer.',
				);
			})
			.it('should throw an error when minimum is not integer');

		setupTest()
			.command([
				'transaction:create:multisignature',
				defaultLifetime,
				defaultMinimum,
				defaultKeysgroup.join(','),
			])
			.it('should create a multisignature transaction', () => {
				expect(validator.validatePublicKeys).to.be.calledWithExactly(
					defaultKeysgroup,
				);
				expect(inputUtils.getInputsFromSources).to.be.calledWithExactly({
					passphrase: {
						source: undefined,
						repeatPrompt: true,
					},
					secondPassphrase: undefined,
				});
				expect(transactions.registerMultisignature).to.be.calledWithExactly({
					networkIdentifier: testnetNetworkIdentifier,
					passphrase: defaultInputs.passphrase,
					secondPassphrase: defaultInputs.secondPassphrase,
					keysgroup: defaultKeysgroup,
					lifetime: parseInt(defaultLifetime, 10),
					minimum: parseInt(defaultMinimum, 10),
				});
				return expect(printMethodStub).to.be.calledWithExactly(
					defaultTransaction,
				);
			});
	});

	describe('transaction:create:multisignature lifetime minimum keysgroup --passphrase=xxx', () => {
		setupTest()
			.command([
				'transaction:create:multisignature',
				defaultLifetime,
				defaultMinimum,
				defaultKeysgroup.join(','),
				'--passphrase=pass:123',
			])
			.it('should create a multisignature transaction', () => {
				expect(validator.validatePublicKeys).to.be.calledWithExactly(
					defaultKeysgroup,
				);
				expect(inputUtils.getInputsFromSources).to.be.calledWithExactly({
					passphrase: {
						source: 'pass:123',
						repeatPrompt: true,
					},
					secondPassphrase: undefined,
				});
				expect(transactions.registerMultisignature).to.be.calledWithExactly({
					networkIdentifier: testnetNetworkIdentifier,
					passphrase: defaultInputs.passphrase,
					secondPassphrase: defaultInputs.secondPassphrase,
					keysgroup: defaultKeysgroup,
					lifetime: parseInt(defaultLifetime, 10),
					minimum: parseInt(defaultMinimum, 10),
				});
				return expect(printMethodStub).to.be.calledWithExactly(
					defaultTransaction,
				);
			});
	});

	describe('transaction:create:multisignature lifetime minimum keysgroup --passphrase=xxx --second-passphrase=xxx', () => {
		setupTest()
			.command([
				'transaction:create:multisignature',
				defaultLifetime,
				defaultMinimum,
				defaultKeysgroup.join(','),
				'--passphrase=pass:123',
				'--second-passphrase=pass:456',
			])
			.it(
				'should create a multisignature transaction with the passphrase and the second passphrase from the flag',
				() => {
					expect(validator.validatePublicKeys).to.be.calledWithExactly(
						defaultKeysgroup,
					);
					expect(inputUtils.getInputsFromSources).to.be.calledWithExactly({
						passphrase: {
							source: 'pass:123',
							repeatPrompt: true,
						},
						secondPassphrase: {
							source: 'pass:456',
							repeatPrompt: true,
						},
					});
					expect(transactions.registerMultisignature).to.be.calledWithExactly({
						networkIdentifier: testnetNetworkIdentifier,
						passphrase: defaultInputs.passphrase,
						secondPassphrase: defaultInputs.secondPassphrase,
						keysgroup: defaultKeysgroup,
						lifetime: parseInt(defaultLifetime, 10),
						minimum: parseInt(defaultMinimum, 10),
					});
					return expect(printMethodStub).to.be.calledWithExactly(
						defaultTransaction,
					);
				},
			);
	});

	describe('transaction:create:multisignature lifetime minimum keysgroup --no-signature', () => {
		setupTest()
			.command([
				'transaction:create:multisignature',
				defaultLifetime,
				defaultMinimum,
				defaultKeysgroup.join(','),
				'--no-signature',
			])
			.it(
				'should create a multisignature transaction without signature',
				() => {
					expect(validator.validatePublicKeys).to.be.calledWithExactly(
						defaultKeysgroup,
					);
					expect(inputUtils.getInputsFromSources).not.to.be.called;
					expect(transactions.registerMultisignature).to.be.calledWithExactly({
						networkIdentifier: testnetNetworkIdentifier,
						passphrase: undefined,
						secondPassphrase: undefined,
						keysgroup: defaultKeysgroup,
						lifetime: parseInt(defaultLifetime, 10),
						minimum: parseInt(defaultMinimum, 10),
					});
					return expect(printMethodStub).to.be.calledWithExactly(
						defaultTransaction,
					);
				},
			);
	});
});
