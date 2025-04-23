import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Repair, RepairSchema } from "../models/repair";
import { registerFunction } from "@apvee/azure-functions-openapi";
import { z } from "zod";
import { RepairStore } from "../config";

export async function getRepair(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`${request.method} ${request.url}`);

    try {
        const repairs: Repair[] = RepairStore.getRepairs();
        const id = parseInt(request.params.id);
        if (isNaN(id)) {
            return { jsonBody: { error: 'Invalid or missing id parameter' }, status: 400 };
        }

        const repairIndex = repairs.findIndex(repair => repair.id === id);

        if (repairIndex === -1) {
            return { jsonBody: { error: 'Repair not found' }, status: 404 };
        }

        return { jsonBody: repairs[repairIndex], status: 200 };
    } catch (error) {
        context.log(`Error updating repair: ${error}`);
        return { jsonBody: { error: "Can't find repair" }, status: 400 };
    }
};

registerFunction('getRepair', 'Get a repair by ID', {
    handler: getRepair,
    route: '/repairs/{id}',
    methods: ['GET'],
    authLevel: process.env.AUTH_LEVEL as 'anonymous' | 'function' | 'admin',
    azureFunctionRoutePrefix: '',
    request: {
        params: z.object({
            id: z.string()
        })
    },
    responses: {
        200: { description: 'Repair found', content: { 'application/json': { schema: RepairSchema } } },
        400: { description: 'Invalid request', content: { 'application/json': { schema: z.object({ error: z.string() }) } } },
        404: { description: 'Repair not found', content: { 'application/json': { schema: z.object({ error: z.string() }) } } },
    }
});