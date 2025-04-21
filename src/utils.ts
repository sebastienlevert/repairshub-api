import { readFileSync } from "fs";
import path from "path";
import { Repair } from "./models/repair";
import { OpenAPIObjectConfig, registerOpenAPIHandler, registerSwaggerUIHandler } from "@apvee/azure-functions-openapi";
import { HttpRequest, HttpResponseInit } from "@azure/functions";

export function getInitialRepairs() {
    const SOURCE_DATA_PATH = path.join(process.cwd(), "src", "data", "repairs.json");
    const rawData = readFileSync(SOURCE_DATA_PATH, "utf-8");
    return JSON.parse(rawData) as Repair[];
}

export function validateContentType(request: HttpRequest): HttpResponseInit | null {
    const contentType = request.headers.get("content-type")?.toLowerCase();
    console.log(contentType);
    if (!contentType?.includes("application/json")) {
        return {
            status: 415,
            jsonBody: { error: "Unsupported Media Type. Please use 'application/json'." }
        };
    }

    return null;
}

export function registerOpenAPI() {
    const openAPIConfig: OpenAPIObjectConfig = {
        info: {
            title: 'Repairs API',
            description: 'A simple service to manage repairs for various items',
            version: "1.0.0"
        },
        servers: [{
            url: process.env.BASE_URL
        }]
    }

    registerOpenAPIHandler("anonymous", openAPIConfig, "3.1.0", "json", 'openapi.json')
} 