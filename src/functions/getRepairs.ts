import { registerFunction } from "@apvee/azure-functions-openapi";
import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { validateContentType } from "../utils";
import { RepairStore } from "../config";
import { z } from "zod";
import { RepairSchema } from "../models/repair";

export async function getRepairs(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`${request.method} ${request.url}`);

    const contentTypeCheck = validateContentType(request);
    if (contentTypeCheck) return contentTypeCheck;

    const repairs = RepairStore.getRepairs();
    let assignedTo = request.query.get('assignedTo');
    let filteredRepairs = repairs;

    if (assignedTo) {
        assignedTo = assignedTo.toLowerCase().trim(); 
        const nameParts = assignedTo.split(' ');
        console.log(nameParts);
        filteredRepairs = repairs.filter(repair => repair.assignedTo?.toLowerCase().includes(nameParts[0]?.trim()) || repair.assignedTo?.toLowerCase().includes(nameParts[1]?.trim()));
    }
    
    return { jsonBody: filteredRepairs, status: 200 };
};


registerFunction('getRepairs', 'Get all repairs', {
    handler: getRepairs,
    route: 'repairs',
    methods: ['GET'],
    authLevel: 'anonymous',
    azureFunctionRoutePrefix: '',
    request: {
        query: z.object({
            assignedTo: z.string().optional()
        })
    },
    responses: {
        200: { description: 'List of repairs', content: { 'application/json': { schema: z.array(RepairSchema) } } },
        400: { description: 'Invalid request', content: { 'application/json': { schema: z.object({ error: z.string() }) } } },
        415: { description: 'Unsupported Media Type', content: { 'application/json': { schema: z.object({ error: z.string() }) } } }
    }
});