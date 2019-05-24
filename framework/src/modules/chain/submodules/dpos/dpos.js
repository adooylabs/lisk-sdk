const { storage } = require('../../../../components/storage');

const { ACTIVE_DELEGATES } = global.constants;

const delegateListCache = {};

const updateDelegateListCache = (roundNo, list) => {};

const saveActiveDelegateList = async (roundNo, list) => {
	// save to `round_delegates`
};

const getDelegatePublicKeysSortedByVote = async () => {
	const filters = { isDelegate: true };
	const options = {
		limit: ACTIVE_DELEGATES,
		sort: ['vote:desc', 'publicKey:asc'],
	};
	const accounts = await storage.entities.Account.get(filters, options);
	return accounts.map(account => account.publicKey);
};

const generateActiveDelegateList = async (roundNo, tx) => {
	if (delegateListCache[roundNo]) {
		return delegateListCache[roundNo];
	}

	let delegatePublicKeys = await storage.entities.Dpos.getRoundDelegates({
		round: roundNo,
	});

	if (!delegatePublicKeys) {
		delegatePublicKeys = await getDelegatePublicKeysSortedByVote();
		await storage.entities.Dpos.create(
			{
				round: roundNo,
				delegatePublicKeys,
			},
			tx
		);
	}

	updateDelegateListCache(roundNo, delegatePublicKeys);
	return delegatePublicKeys;
};

const shuffleActiveDelegateList = async (roundNo, list) => {};

const getRoundDelegates = (roundNo, tx) => {
	const list = generateActiveDelegateList(roundNo, tx);

	return shuffleActiveDelegateList(roundNo, list);
};

module.exports = {
	updateDelegateListCache,
	saveActiveDelegateList,
	generateActiveDelegateList,
	shuffleActiveDelegateList,
	// public functions
	getRoundDelegates,
};
