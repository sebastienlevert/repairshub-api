import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Repair, RepairSchema } from "../models/repair";
import { registerFunction } from "@apvee/azure-functions-openapi";
import { z } from "zod";
import { RepairStore } from "../config";
import { validateContentType } from "../utils";


export async function deleteRepair(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`${request.method} ${request.url}`);

    const contentTypeCheck = validateContentType(request);
    if (contentTypeCheck) return contentTypeCheck;

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

        const deletedRepair = repairs[repairIndex];
        repairs.splice(repairIndex, 1);
        context.log(`Repair deleted: ${JSON.stringify(deletedRepair)}`);

        return { jsonBody: { message: 'Repair deleted successfully' }, status: 200 };
    } catch (error) {
        context.log(`Error deleting repair: ${error}`);
        return { jsonBody: { error: 'Failed to delete repair' }, status: 500 };
    }
};


registerFunction('deleteRepair', 'Delete a repair by ID', {
    handler: deleteRepair,
    route: 'repairs/{id}',
    methods: ['DELETE'],
    authLevel: 'anonymous',
    azureFunctionRoutePrefix: '',
    request: {
        params: z.object({
            id: z.string()
        })
    },
    responses: {
        200: { description: 'Repair deleted', content: { 'application/json': { schema: z.object({ message: z.string() }) } } },
        400: { description: 'Invalid request', content: { 'application/json': { schema: z.object({ error: z.string() }) } } },
        404: { description: 'Repair not found', content: { 'application/json': { schema: z.object({ error: z.string() }) } } },
        415: { description: 'Unsupported Media Type', content: { 'application/json': { schema: z.object({ error: z.string() }) } } }
    }
});
