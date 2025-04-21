import { HttpRequest, InvocationContext } from "@azure/functions";
import { getInitialRepairs } from "../utils";
import { RepairStore } from "../config";
import { Repair } from "../models/repair";
import { getRepairs } from "../functions/getRepairs";
import { getRepair } from "../functions/getRepair";
import { postRepair } from "../functions/postRepair";
import { patchRepair } from "../functions/patchRepair";
import { deleteRepair } from "../functions/deleteRepair";

let mockRepairs: Repair[] = RepairStore.getRepairs();

// Helper to create mock requests
const createMockRequest = (params = {}, query = new Map(), body?: any): any => ({
  query: query,
  params: params,
  body: body,
  headers: new Map([
    ['content-type', 'application/json'],
  ]),
});

// Mock context
const mockContext = {
  log: jest.fn(),
  invocationId: 'test-id',
  functionName: 'test-function',
  traceContext: { traceparent: '', tracestate: '', attributes: {} },
  bindingDefinitions: [],
  bindingData: {},
  executionContext: { invocationId: '', functionName: '', functionDirectory: '' },
  options: {}
} as unknown as InvocationContext;

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  // Reset mockRepairs to initial state
  mockRepairs.length = 0;
  mockRepairs.push(...getInitialRepairs());
});

describe('Repairs API', () => {
  /**
   * Tests for getRepairs function
   */
  describe('getRepairs', () => {
    it('should return all repairs when no filter is applied', async () => {
      const request = createMockRequest({}, new Map());
      
      const response = await getRepairs(request, mockContext);
      
      expect(response.status).toBe(200);
      expect(response.jsonBody).toHaveLength(9);
      expect(mockContext.log).toHaveBeenCalled();
    });

    it('should filter repairs by assignedTo parameter (first name)', async () => {
      const query = new Map();
      query.set('assignedTo', 'Karin');
      const request = createMockRequest({}, query);
      
      const response = await getRepairs(request, mockContext);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.jsonBody)).toBe(true);
      expect(response.jsonBody).toHaveLength(2);
      expect(response.jsonBody[0].id).toBe(1);
    });

    it('should filter repairs by assignedTo parameter (last name)', async () => {
      const query = new Map();
      query.set('assignedTo', 'Phillips');
      const request = createMockRequest({}, query);
      
      const response = await getRepairs(request, mockContext);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.jsonBody)).toBe(true);
      expect(response.jsonBody).toHaveLength(1);
      expect(response.jsonBody[0].id).toBe(6);
    });

    it('should filter repairs by assignedTo parameter (full name)', async () => {
      const query = new Map();
      query.set('assignedTo', 'Daisy Phillips');
      const request = createMockRequest({}, query);
      
      const response = await getRepairs(request, mockContext);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.jsonBody)).toBe(true);
      expect(response.jsonBody).toHaveLength(1);
      expect(response.jsonBody[0].id).toBe(6);
    });

    it('should handle empty results when filter does not match', async () => {
      const query = new Map();
      query.set('assignedTo', 'NonExistentName');
      const request = createMockRequest({}, query);
      
      const response = await getRepairs(request, mockContext);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.jsonBody)).toBe(true);
      expect(response.jsonBody).toHaveLength(0);
    });

    it('should trim and lowercase assignedTo for case-insensitive search', async () => {
      const query = new Map();
      query.set('assignedTo', '  DAISY  ');
      const request = createMockRequest({}, query);
      
      const response = await getRepairs(request, mockContext);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.jsonBody)).toBe(true);
      expect(response.jsonBody).toHaveLength(1);
      expect(response.jsonBody[0].id).toBe(6);
    });
  });

  /**
   * Tests for getRepair function
   */
  describe('getRepair', () => {
    it('should return a repair by its ID', async () => {
      const request = createMockRequest({ id: '1' });
      
      const response = await getRepair(request, mockContext);
      
      expect(response.status).toBe(200);
      expect(response.jsonBody).toBeDefined();
      expect(response.jsonBody.id).toBe(1);
    });

    it('should return 404 for non-existent repair', async () => {
      const request = createMockRequest({ id: '999' });
      
      const response = await getRepair(request, mockContext);
      
      expect(response.status).toBe(404);
      expect(response.jsonBody).toEqual({ error: 'Repair not found' });
    });

    it('should return 400 for invalid ID format', async () => {
      const request = createMockRequest({ id: 'abc' });
      
      const response = await getRepair(request, mockContext);
      
      expect(response.status).toBe(400);
      expect(response.jsonBody).toEqual({ error: 'Invalid or missing id parameter' });
    });

    it('should handle missing ID parameter', async () => {
      const request = createMockRequest({});
      
      const response = await getRepair(request, mockContext);
      
      expect(response.status).toBe(400);
      expect(response.jsonBody).toEqual({ error: 'Invalid or missing id parameter' });
    });
  });

  /**
   * Tests for postRepair function
   */
  describe('postRepair', () => {
    it('should create a new repair and return 201 status', async () => {
      const newRepairData = {
        title: 'New Repair',
        description: 'Test new repair',
        assignedTo: 'Test Person',
        date: '2023-06-01',
        image: 'https://test.com/new-image.jpg'
      };
      
      const request = createMockRequest({}, new Map(), newRepairData);
      
      const response = await postRepair(request, mockContext);
      
      console.log(response);

      expect(response.status).toBe(201);
      expect(response.jsonBody).toBeDefined();
      expect(response.jsonBody.id).toBe(10);
      expect(response.jsonBody.title).toBe('New Repair');
      expect(mockContext.log).toHaveBeenCalledWith(expect.stringContaining('New repair created'));
    });

    it('should handle invalid JSON in request body', async () => {
      const request = createMockRequest();
      // Override the json method to simulate an error
      request.json = jest.fn().mockRejectedValue(new Error('Invalid JSON'));
      
      const response = await postRepair(request, mockContext);
      
      expect(response.status).toBe(400);
      expect(response.jsonBody).toEqual({ error: 'Invalid JSON in request body' });
      expect(mockContext.log).toHaveBeenCalledWith(expect.stringContaining('Error creating repair'));
    });
  });

  /**
   * Tests for patchRepair function
   */
  describe('patchRepair', () => {
    it('should update an existing repair and return 200 status', async () => {
      const updateData = {
        title: 'Updated Title',
        assignedTo: 'Updated Person'
      };
      
      const request = createMockRequest({ id: '1' }, new Map(), updateData);
      
      const response = await patchRepair(request, mockContext);
      
      expect(response.status).toBe(200);
      expect(response.jsonBody).toBeDefined();
      expect(response.jsonBody.id).toBe(1);
      expect(response.jsonBody.title).toBe('Updated Title');
      expect(response.jsonBody.assignedTo).toBe('Updated Person');
      // Original data should be preserved
      expect(response.jsonBody.date).toBe('2023-05-23');
      expect(mockContext.log).toHaveBeenCalledWith(expect.stringContaining('Repair updated'));
    });

    it('should return 404 when trying to update non-existent repair', async () => {
      const updateData = {
        title: 'Updated Title'
      };
      
      const request = createMockRequest({ id: '999' }, new Map(), updateData);
      
      const response = await patchRepair(request, mockContext);
      
      expect(response.status).toBe(404);
      expect(response.jsonBody).toEqual({ error: 'Repair not found' });
    });

    it('should return 400 for invalid ID format', async () => {
      const updateData = {
        title: 'Updated Title'
      };
      
      const request = createMockRequest({ id: 'abc' }, new Map(), updateData);
      
      const response = await patchRepair(request, mockContext);
      
      expect(response.status).toBe(400);
      expect(response.jsonBody).toEqual({ error: 'Invalid or missing id parameter' });
    });
  });

  /**
   * Tests for deleteRepair function
   */
  describe('deleteRepair', () => {
    it('should delete an existing repair and return 200 status', async () => {
      const request = createMockRequest({ id: '1' });
      
      const response = await deleteRepair(request, mockContext);
      
      expect(response.status).toBe(200);
      expect(response.jsonBody).toBeDefined();
      expect(response.jsonBody.message).toBe('Repair deleted successfully');
      
      // Verify it was actually removed
      const getRequest = createMockRequest({ id: '1' });
      const getResponse = await getRepair(getRequest, mockContext);
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 when trying to delete non-existent repair', async () => {
      const request = createMockRequest({ id: '999' });
      
      const response = await deleteRepair(request, mockContext);
      
      expect(response.status).toBe(404);
      expect(response.jsonBody).toEqual({ error: 'Repair not found' });
    });

    it('should return 400 for invalid ID format', async () => {
      const request = createMockRequest({ id: 'abc' });
      
      const response = await deleteRepair(request, mockContext);
      
      expect(response.status).toBe(400);
      expect(response.jsonBody).toEqual({ error: 'Invalid or missing id parameter' });
    });

    it('should handle missing ID parameter', async () => {
      const request = createMockRequest({});
      
      const response = await deleteRepair(request, mockContext);
      
      expect(response.status).toBe(400);
      expect(response.jsonBody).toEqual({ error: 'Invalid or missing id parameter' });
    });
  });
});