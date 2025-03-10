import { Router } from "express";
import { TestController } from "../controllers/TestController";

const router = Router();
const testController = new TestController();

/**
 * @swagger
 * /api/execute-test:
 *   post:
 *     summary: Ejecuta una prueba
 *     description: Endpoint para ejecutar una prueba específica.
 *     tags:
 *       - Test
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               testId:
 *                 type: string
 *                 description: ID de la prueba a ejecutar.
 *             example:
 *               testId: "12345"
 *     responses:
 *       200:
 *         description: Resultado de la prueba.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 result:
 *                   type: string
 *               example:
 *                 success: true
 *                 result: "Prueba ejecutada correctamente"
 *       400:
 *         description: Error en la solicitud.
 */
router.post("/execute-test", testController.executeTest);

export default router;
