/*
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
 */

'use strict';

const async = require('async');
const application = require('../../../common/application');
const modulesLoader = require('../../../common/modules_loader');
const clearDatabaseTable = require('../../../common/storage_sandbox')
	.clearDatabaseTable;
const loadTables = require('./process_tables_data.json');

const { REWARDS } = global.constants;

describe('integration test (blocks) - process', () => {
	let blocksProcess;
	let blocks;
	let storage;
	let originalBlockRewardsOffset;

	before(done => {
		// Force rewards start at 150-th block
		originalBlockRewardsOffset = REWARDS.OFFSET;
		REWARDS.OFFSET = 150;

		application.init(
			{ sandbox: { name: 'blocks_process' } },
			(err, scopeInit) => {
				blocksProcess = scopeInit.modules.blocks.process;
				blocks = scopeInit.modules.blocks;
				storage = scopeInit.components.storage;
				done(err);
			},
		);
	});

	after(done => {
		REWARDS.OFFSET = originalBlockRewardsOffset;
		application.cleanup(done);
	});

	beforeEach(done => {
		async.series(
			{
				clearTables: seriesCb => {
					async.every(
						[
							'blocks WHERE height > 1',
							'trs WHERE "blockId" != \'10620616195853047363\'',
							"mem_accounts WHERE address IN ('2737453412992791987L', '2896019180726908125L')",
						],
						(table, everyCb) => {
							clearDatabaseTable(
								storage,
								modulesLoader.scope.components.logger,
								table,
							)
								.then(res => {
									everyCb(null, res);
								})
								.catch(error => {
									everyCb(error, null);
								});
						},
						err => {
							if (err) {
								return setImmediate(err);
							}
							return setImmediate(seriesCb);
						},
					);
				},
				loadTables: seriesCb => {
					async.everySeries(
						loadTables,
						(table, everySeriesCb) => {
							const cs = new storage.adapter.db.$config.pgp.helpers.ColumnSet(
								table.fields,
								{
									table: table.name,
								},
							);
							const insert = storage.adapter.db.$config.pgp.helpers.insert(
								table.data,
								cs,
							);
							storage.adapter
								.execute(insert)
								.then(() => {
									everySeriesCb(null, true);
								})
								.catch(err => {
									return setImmediate(everySeriesCb, err);
								});
						},
						err => {
							if (err) {
								return setImmediate(seriesCb, err);
							}
							return setImmediate(seriesCb);
						},
					);
				},
			},
			err => {
				if (err) {
					return done(err);
				}
				return done();
			},
		);
	});

	describe('loadBlocksWithOffset() - no errors', () => {
		it('should load block 2 from db: block without transactions', async () => {
			const loadedBlocks = await blocks.getJSONBlocksWithLimitAndOffset(1, 2);

			const block = loadedBlocks[0];
			expect(block.height).to.equal(2);
		});

		it('should load block 3 from db: block with transactions', async () => {
			const loadedBlocks = await blocks.getJSONBlocksWithLimitAndOffset(1, 3);
			const block = loadedBlocks[0];
			expect(block.height).to.equal(3);
		});
	});

	describe('loadBlocksOffset() - block/transaction errors', () => {
		// eslint-disable-next-line
		it(
			'TODO: BLOCKS REFACTOR - should load block 4 from db and return blockSignature error',
		);
		// eslint-disable-next-line
		it(
			'TODO: BLOCKS REFACTOR - should load block 5 from db and return payloadHash error',
		);
		// eslint-disable-next-line
		it(
			'TODO: BLOCKS REFACTOR - should load block 6 from db and return block timestamp error',
		);
		// eslint-disable-next-line
		it(
			'TODO: BLOCKS REFACTOR - should load block 7 from db and return unknown transaction type error',
		);
		// eslint-disable-next-line
		it(
			'TODO: BLOCKS REFACTOR - should load block 8 from db and return block version error',
		);
		// eslint-disable-next-line
		it(
			'TODO: BLOCKS REFACTOR - should load block 9 from db and return previousBlockId error (fork:1)',
		);

		// eslint-disable-next-line
		it.skip('should load block 10 from db and return duplicated votes error', done => {
			blocks.lastBlock.set(loadTables[0].data[7]);

			blocksProcess.loadBlocksOffset(1, 10, (err, loadedBlock) => {
				if (err) {
					expect(err).equal(
						'Failed to validate vote schema: Array items are not unique (indexes 0 and 4)',
					);
					return done();
				}

				return done(loadedBlock);
			});
		});
	});
});
