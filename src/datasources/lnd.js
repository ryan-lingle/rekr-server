const { authenticatedLndGrpc, createInvoice, subscribeToInvoices } = require('ln-service');
const DB = require('../models');
const Rek = DB.rek;

const {lnd} = authenticatedLndGrpc({
  macaroon: process.env.ADMIN_MACAROON,
  socket: 'btcpay464279.lndyn.com',
});

async function getInvoice(tokens) {
  const { request, id } = await createInvoice({lnd, tokens});
  subscribeInvoice(id)
  return { request, id }
}

async function subscribeInvoice(invoiceId) {
  const sub = subscribeToInvoices({lnd});
  sub.on('invoice_updated', readInvoice);

  async function readInvoice({ id }) {
    if (id == invoiceId) {
      console.log("recieved!")
      sub.removeListener('invoice_updated', readInvoice)
      const rek = await Rek.findOne({ where: { invoiceId }})
      pubsub.publish('INVOICE_ADDED', { rek })
    }
  }
}

module.exports = { getInvoice, subscribeInvoice };
