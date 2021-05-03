const TG = require('telegram-bot-api');
const KrakenClient = require('kraken-api');
require('dotenv').config();

const kraken = new KrakenClient(process.env.KRAKEN_KEY, process.env.KRAKEN_SECRET);
const telegram = new TG({ token: process.env.TELEGRAM_TOKEN });

(async () => {
  try {
    // check balance
    const balance = await kraken.api('Balance');
    if (balance.result.ZEUR <= process.env.QUANTITY) {
      throw new Error('Not enough balance');
    }

    // calculate volume and min order
    const pairInfo = await kraken.api('Ticker', { pair: process.env.PAIR });
    const assetInfo = await kraken.api('AssetPairs', { pair: process.env.PAIR });
    const volume = process.env.QUANTITY / pairInfo.result[process.env.PAIR].a[0];
    if (volume < assetInfo.result[process.env.PAIR].ordermin) {
      throw new Error('Volume not allowed');
    }

    // trade
    const response = await kraken.api('AddOrder', {
      pair: process.env.PAIR,
      type: 'buy',
      ordertype: 'market',
      volume: volume,
      validate: process.env.TEST_MODE,
    });
    telegram.sendMessage({
      chat_id: process.env.CHAT_ID,
      text: response.result.descr.order,
    });
  } catch (error) {
    telegram.sendMessage({
      chat_id: process.env.CHAT_ID,
      text: error.message || error.description,
    });
  }
})();
