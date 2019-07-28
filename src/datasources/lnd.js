const { authenticatedLndGrpc, createInvoice, subscribeToInvoices } = require('ln-service');
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

module.exports = { getInvoice, subscribeInvoice };
