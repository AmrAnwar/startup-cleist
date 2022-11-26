const express = require("express");

const recordRoutes = express.Router();

const dbo = require("../db/conn");

recordRoutes.route("/department").get(async function (req, res) {
  const dbConnect = dbo.getDb();

  dbConnect
    .collection("department")
    .find({}).limit(50)
    .toArray(function (err, result) {
      if (err) {
        res.status(400).send("Error fetching listings!");
     } else {
        res.json(result);
      }
    });
});

const getSuitableProductForRequirement = (sortedProducts, additionalRequirement) => {
  for (const product of sortedProducts) {
    req = product.metadata.find((element) => element.type == additionalRequirement.type);
    if (Number(req.value) >= Number(additionalRequirement.value)) {
      return product
    }
  }
}

const checkInBudget = (products, budget) => {
  let totalPrice = 0
  for (const product of products) {
    console.log(product)
    totalPrice += Number(product.price);
  }
  return totalPrice <= budget
}

recordRoutes.route("/recommendations").post(async function (req, res) {
  const body = req.body;
  const budget = body.budget;
  const departmentName = body.department;
  const dbConnect = dbo.getDb();

  const department = await dbConnect
    .collection("department")
    .findOne({ name: departmentName });
  const slectedDevices = await Promise.all(department.devices.map(async (device) => {
    const products = await dbConnect
      .collection("product")
      .find({ type: device.type }).toArray();
    products.sort(function (a, b) { return a.price - b.price });
    if (device.additionalRequirement) {
      return getSuitableProductForRequirement(products, device.additionalRequirement[0])
    }
    else return products[0];
  }));
  if (checkInBudget(slectedDevices, budget)) {
      return res.json({"message": "SUCCESS", devices: slectedDevices})
  }
  else {
      return res.json({"message": "INVALID_BUDGET", devices: []})
  }

});

module.exports = recordRoutes;
