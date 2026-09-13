import express from 'express';
import { getSitemap, getLlmsFull } from '../controllers/seo.controller.js';

const router = express.Router();

// ❗ These are raw text/XML responses for crawlers and LLM readers — NOT JSON.
// Longest-prefix robots rule: /api/seo/ is Allow-ed ahead of the /api/ Disallow.
router.get('/sitemap.xml', getSitemap);
router.get('/llms-full.txt', getLlmsFull);

export default router;