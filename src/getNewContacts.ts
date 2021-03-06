import { getListOfLicenses } from './getLicenseInfo';
import { config } from './config';
import * as dbHelper from 'database-helpers';
import Webhook from 'webhook-discord';

(async () => {
    const hook = new Webhook(config.discordWebhook);
    try {
        const dbUrl = `mongodb://${config.mongoUser}:${config.mongoPass}@${config.mongoUrl}/${config.mongoDB}`;
        const db = await dbHelper.initializeMongo(dbUrl);
        let contacts = await dbHelper.getAllFromMongo(db, config.mongoCollection, {}, {}, );
        const originalCount = contacts.length;
        let ubuntu = false;
        let headless = true;
        if (process.argv[2] === 'ubuntu' || process.argv[3] === 'ubuntu') {
            ubuntu = true;
        }
        if (process.argv[2] === 'withHead' || process.argv[3] === 'withHead') {
            headless = false;
        }
        contacts = await getListOfLicenses(contacts, ubuntu, headless);
        const newCount = contacts.length;

        await hook.info('BOM License Checker', `${newCount - originalCount} new doctor${newCount - originalCount === 1 ? '' : 's'} found.`);
        if (newCount > originalCount) {
            for (let i = 0; i < contacts.length; i++) {
                const currentDate = new Date();
                if (!contacts[i]._id) {
                    contacts[i].createdAt = currentDate;
                    contacts[i].updatedAt = currentDate;
                    const insertResponse = await dbHelper.insertToMongo(db, config.mongoCollection, contacts[i]);
                    console.log('insert response', insertResponse);
                }
            }
        }
        process.exit();
    }
    catch (e) {
        console.log('error in index', e);
        await hook.err('BOM License Error', `Error while getting new doctors. ${e}`);
        process.exit();
    }
})();