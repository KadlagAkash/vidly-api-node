import express from "express";
import mongoose from "mongoose";

import { Genre, validate } from "../models/genre.js";
import validateObjectId from "../middleware/validateObjectId.js";

const router = express.Router();

// TODO: Add authentication for POST, PUT, DELETE
// TODO: Add authorization for DELETE

// Get all genres
router.get("/", async (req, res) => {
	const genres = await Genre.find({}, { __v: 0 }).sort({ name: 1 });
	res.json(genres);
});

// Get a specific genre by ID
router.get("/:id", validateObjectId, async (req, res) => {
	const genre = await Genre.findById(req.params.id);
	if (!genre)
		return res.status(404).send("The genre with the given ID was not found");
	res.json(genre);
});

// Create a new genre
router.post("/", async (req, res) => {
	const { success, error } = validate(req.body);
	if (!success) return res.status(400).send(error.issues[0].message);

	const genre = new Genre({
		name: req.body.name,
	});
	await genre.save();

	res.status(201).json(genre);
});

// Update a genre by ID
router.put("/:id", validateObjectId, async (req, res) => {
	const { success, error } = validate(req.body);
	if (!success) return res.status(400).send(error.issues[0].message);

	const genre = await Genre.findByIdAndUpdate(
		req.params.id,
		{ name: req.body.name },
		{ new: true }
	);
	if (!genre)
		return res.status(404).send("The genre with the given ID was not found");

	res.json(genre);
});

// Delete a genre by ID
router.delete("/:id", validateObjectId, async (req, res) => {
	const genre = await Genre.findByIdAndDelete(req.params.id);
	if (!genre)
		return res.status(404).send("The genre with the given ID was not found");

	res.json(genre); 
});

export default router;