import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Repair, RepairSchema } from "../models/repair";
import { registerFunction } from "@apvee/azure-functions-openapi";
import { z } from "zod";
import { RepairStore } from "../config";
import { validateContentType } from "../utils";

export async function postRepair(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`${request.method} ${request.url}`);

    const contentTypeCheck = validateContentType(request);
    if (contentTypeCheck) return contentTypeCheck;

    try {
        const repairs: Repair[] = RepairStore.getRepairs();
        const data: Partial<Repair> = await request.json();

        console.log(data);

        const id = repairs.length > 0 ? Math.max(...repairs.map(repair => repair.id)) + 1 : 1;
        const newRepair = { 
            id: id,
            title: data.title,
            description: data.description,
            assignedTo: data.assignedTo,
            date: data.date,
            image: data.image
        };
        repairs.push(newRepair);
        context.log(`New repair created: ${JSON.stringify(newRepair)}`);
        return { jsonBody: newRepair, status: 201 };
    } catch (error) {
        context.log(`Error creating repair: ${error}`);
        return { jsonBody: { error:  `Invalid JSON in request body` }, status: 400 };
    }    
};

registerFunction('postRepair', 'Create a new repair', {
    handler: postRepair,
    route: '/repairs',
    methods: ['POST'],
    authLevel: process.env.AUTH_LEVEL as 'anonymous' | 'function' | 'admin',
    azureFunctionRoutePrefix: '',
    request: {
        body: {
            content: { 'application/json': { schema: RepairSchema.omit({ id: true }) } },
            required: true
        }
    },
    responses: {
        201: { description: 'Repair created', content: { 'application/json': { schema: RepairSchema } } },
        400: { description: 'Invalid request', content: { 'application/json': { schema: z.object({ error: z.string() }) } } },
        415: { description: 'Unsupported Media Type', content: { 'application/json': { schema: z.object({ error: z.string() }) } } }
    }
});