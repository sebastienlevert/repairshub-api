import { registerFunction } from "@apvee/azure-functions-openapi";
import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { RepairStore } from "../config";
import { z } from "zod";
import { Repair, RepairSchema } from "../models/repair";

export async function getRepairs(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`${request.method} ${request.url}`);

    const repairs: Repair[] = RepairStore.getRepairs();
    let assignedTo = request.query.get('assignedTo');
    let filteredRepairs = repairs;

    if (assignedTo) {
        assignedTo = assignedTo.toLowerCase().trim(); 
        const nameParts = assignedTo.split(' ');
        filteredRepairs = repairs.filter(repair => repair.assignedTo?.toLowerCase().includes(nameParts[0]?.trim()) || repair.assignedTo?.toLowerCase().includes(nameParts[1]?.trim()));
    }
    
    return { jsonBody: filteredRepairs, status: 200 };
};


registerFunction('getRepairs', 'Get all repairs', {
    handler: getRepairs,
    route: '/repairs',
    methods: ['GET'],
    authLevel: process.env.AUTH_LEVEL as 'anonymous' | 'function' | 'admin',
    azureFunctionRoutePrefix: '',
    request: {
        query: z.object({
            assignedTo: z.string().optional()
        })
    },
    responses: {
        200: { description: 'List of repairs', content: { 'application/json': { schema: z.array(RepairSchema) } } },
        400: { description: 'Invalid request', content: { 'application/json': { schema: z.object({ error: z.string() }) } } },
    }
});