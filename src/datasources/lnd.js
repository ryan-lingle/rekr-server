const { authenticatedLndGrpc, createInvoice, subscribeToInvoices } = require('ln-service');
const { pubsub } = require('../pubsub');
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
  sub.on('error', (error) => {
    console.log(error)
    if (error.code == 1) {
      subscribeInvoice(invoiceId)
    }
  })

  async function readInvoice({ id }) {
    if (id == invoiceId) {
      console.log("recieved!")
      sub.removeListener('invoice_updated', readInvoice)
      Rek.update({ paid: true }, { where: { invoiceId }})
      const rek = await Rek.findOne({ where: { invoiceId }})
      pubsub.publish('INVOICE_PAID', { rek })
    }
  }
}

module.exports = { getInvoice, subscribeInvoice };
