import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Repair, RepairSchema } from "../models/repair";
import { registerFunction } from "@apvee/azure-functions-openapi";
import { z } from "zod";
import { RepairStore } from "../config";
import { validateContentType } from "../utils";

export async function patchRepair(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`${request.method} ${request.url}`);

    const contentTypeCheck = validateContentType(request);
    if (contentTypeCheck) return contentTypeCheck;

    try {
        const repairs: Repair[] = RepairStore.getRepairs();
        const id = parseInt(request.params.id);
        if (isNaN(id)) {
            return { jsonBody: { error: 'Invalid or missing id parameter' }, status: 400 };
        }

        const data: Partial<Repair> = await request.json();
        const repairIndex = repairs.findIndex(repair => repair.id === id);

        if (repairIndex === -1) {
            return { jsonBody: { error: 'Repair not found' }, status: 404 };
        }

        const updatedRepair = { ...repairs[repairIndex], ...data };
        repairs[repairIndex] = updatedRepair;
        context.log(`Repair updated: ${JSON.stringify(updatedRepair)}`);

        return { jsonBody: updatedRepair, status: 200 };
    } catch (error) {
        context.log(`Error updating repair: ${error}`);
        return { jsonBody: { error: 'Invalid JSON in request body' }, status: 400 };
    }
};



registerFunction('patchRepair', 'Update a repair by ID', {
    handler: patchRepair,
    route: '/repairs/{id}',
    methods: ['PATCH'],
    authLevel: process.env.AUTH_LEVEL as 'anonymous' | 'function' | 'admin',
    azureFunctionRoutePrefix: '',
    request: {
        params: z.object({
            id: z.string()
        }),
        body: {
            content: { 'application/json': { schema: RepairSchema.partial() } },
            required: true
        }
    },
    responses: {
        200: { description: 'Repair updated', content: { 'application/json': { schema: RepairSchema } } },
        400: { description: 'Invalid request', content: { 'application/json': { schema: z.object({ error: z.string() }) } } },
        404: { description: 'Repair not found', content: { 'application/json': { schema: z.object({ error: z.string() }) } } },
        415: { description: 'Unsupported Media Type', content: { 'application/json': { schema: z.object({ error: z.string() }) } } }
    }
});