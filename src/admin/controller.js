const cors = require('cors');
const express = require('express');
const adminMetrics = require('./metrics');
const errorLogger = require('./error_logger');

module.exports = function adminController(app) {
  app.use(cors());
  app.use(express.json());

  app.get("/admin/api", async (req, res) => {
    const data = await adminMetrics(req);
    res.set("Access-Control-Allow-Credentials", true);
    res.send(data);
  });

  app.post("/admin/error", async (req, res) => {
    errorLogger(req.body);
  });
};
