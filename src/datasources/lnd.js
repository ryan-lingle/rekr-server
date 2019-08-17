const {
  authenticatedLndGrpc,
  createInvoice,
  subscribeToInvoices,
  decodePaymentRequest,
  pay
} = require('ln-service');
const { pubsub } = require('../pubsub');
const DB = require('../models');
const Rek = DB.rek;

const {lnd} = authenticatedLndGrpc({
  macaroon: process.env.ADMIN_MACAROON,
  socket: 'btcpay464279.lndyn.com',
});

async function getInvoice(satoshis, callback) {
  const { request, id } = await createInvoice({lnd, tokens: satoshis });
  subscribeInvoice({ request, id }, callback);
  return request;
}

async function subscribeInvoice(invoice, callback) {
  const sub = subscribeToInvoices({lnd});
  sub.on('invoice_updated', readInvoice);
  sub.on('error', function(error) {
    console.log(error)
    if (error.code == 1) {
      subscribeInvoice(invoice, callback)
    }
  })

  async function readInvoice({ id }) {
    if (id == invoice.id) {
      console.log("recieved!")
      sub.removeListener('invoice_updated', readInvoice)
      callback(invoice.request);
    }
  }
}

async function withdraw(request, userSatoshis) {
  console.log(userSatoshis);
  const { is_expired, tokens } = await decodePaymentRequest({ lnd, request });
  console.log(tokens);
  if (is_expired) {
    throw new Error('The invoice you supplied was expired.');
  } else if (tokens > userSatoshis) {
    throw new Error('Insufficient Funds');
  } else {
    try {
      const { is_confirmed } = await pay({ lnd, request });
      if (is_confirmed) return { satoshis: tokens, success: true };
    } catch(err) {
      return { success: false, error: err };
    }
  }
}

module.exports = { getInvoice, withdraw };
