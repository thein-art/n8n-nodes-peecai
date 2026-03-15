import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PeecAi } from './PeecAi.node';
import type { IExecuteFunctions, ILoadOptionsFunctions } from 'n8n-workflow';

function createMockExecuteFunctions(params: Record<string, unknown> = {}): IExecuteFunctions {
	const httpRequestWithAuthentication = vi.fn();
	const mock = {
		getInputData: vi.fn().mockReturnValue([{ json: {} }]),
		getNodeParameter: vi.fn().mockImplementation((name: string) => {
			if (name in params) return params[name];
			throw new Error(`Unexpected parameter: ${name}`);
		}),
		getNode: vi.fn().mockReturnValue({ name: 'PeecAi' }),
		continueOnFail: vi.fn().mockReturnValue(false),
		helpers: {
			httpRequestWithAuthentication: Object.assign(httpRequestWithAuthentication, {
				call: httpRequestWithAuthentication,
			}),
		},
	} as unknown as IExecuteFunctions;
	return mock;
}

describe('PeecAi Node', () => {
	let node: PeecAi;

	beforeEach(() => {
		node = new PeecAi();
	});

	describe('description', () => {
		it('should have correct basic properties', () => {
			expect(node.description.name).toBe('peecAi');
			expect(node.description.displayName).toBe('Peec AI');
			expect(node.description.usableAsTool).toBe(true);
			expect(node.description.version).toBe(1);
		});

		it('should define 12 resources', () => {
			const resourceProp = node.description.properties.find((p) => p.name === 'resource');
			expect(resourceProp).toBeDefined();
			expect((resourceProp!.options as Array<{ value: string }>).length).toBe(12);
		});

		it('should require peecAiApi credentials', () => {
			expect(node.description.credentials).toEqual([
				{ name: 'peecAiApi', required: true },
			]);
		});
	});

	describe('execute - project getAll', () => {
		it('should fetch all projects when returnAll is true', async () => {
			const ctx = createMockExecuteFunctions({
				resource: 'project',
				operation: 'getAll',
				returnAll: true,
			});
			const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
			httpMock.mockResolvedValueOnce({ data: [{ id: '1', name: 'P1' }] });

			const result = await node.execute.call(ctx);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toEqual({ id: '1', name: 'P1' });
			expect(result[0][0].pairedItem).toBe(0);
			expect(httpMock).toHaveBeenCalledWith(
				ctx,
				'peecAiApi',
				expect.objectContaining({
					method: 'GET',
					url: 'https://api.peec.ai/customer/v1/projects',
					timeout: 30_000,
				}),
			);
		});

		it('should fetch limited projects when returnAll is false', async () => {
			const ctx = createMockExecuteFunctions({
				resource: 'project',
				operation: 'getAll',
				returnAll: false,
				limit: 10,
				offset: 5,
			});
			const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
			httpMock.mockResolvedValueOnce({ data: [{ id: '1' }, { id: '2' }] });

			const result = await node.execute.call(ctx);

			expect(result[0]).toHaveLength(2);
			expect(httpMock).toHaveBeenCalledWith(
				ctx,
				'peecAiApi',
				expect.objectContaining({
					qs: { limit: 10, offset: 5 },
				}),
			);
		});

		it('should paginate when returnAll is true and API returns full batches', async () => {
			const ctx = createMockExecuteFunctions({
				resource: 'project',
				operation: 'getAll',
				returnAll: true,
			});
			const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
			const batch1 = Array.from({ length: 100 }, (_, i) => ({ id: `${i}` }));
			const batch2 = [{ id: '100' }, { id: '101' }];
			httpMock
				.mockResolvedValueOnce({ data: batch1 })
				.mockResolvedValueOnce({ data: batch2 });

			const result = await node.execute.call(ctx);

			expect(result[0]).toHaveLength(102);
			expect(httpMock).toHaveBeenCalledTimes(2);
		});
	});

	describe('execute - brand getAll', () => {
		it('should pass project_id as query parameter', async () => {
			const ctx = createMockExecuteFunctions({
				resource: 'brand',
				operation: 'getAll',
				projectId: 'proj-123',
				returnAll: false,
				limit: 50,
				offset: 0,
			});
			const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
			httpMock.mockResolvedValueOnce({ data: [{ id: 'b1', name: 'Brand 1' }] });

			const result = await node.execute.call(ctx);

			expect(result[0][0].json).toEqual({ id: 'b1', name: 'Brand 1' });
			expect(httpMock).toHaveBeenCalledWith(
				ctx,
				'peecAiApi',
				expect.objectContaining({
					url: 'https://api.peec.ai/customer/v1/brands',
					qs: expect.objectContaining({ project_id: 'proj-123' }),
				}),
			);
		});
	});

	describe('execute - chat getAll with dates', () => {
		it('should apply date params to query string', async () => {
			const ctx = createMockExecuteFunctions({
				resource: 'chat',
				operation: 'getAll',
				projectId: 'proj-1',
				startDate: '2025-01-15T00:00:00.000Z',
				endDate: '2025-02-15T00:00:00.000Z',
				returnAll: false,
				limit: 50,
				offset: 0,
			});
			const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
			httpMock.mockResolvedValueOnce({ data: [] });

			await node.execute.call(ctx);

			expect(httpMock).toHaveBeenCalledWith(
				ctx,
				'peecAiApi',
				expect.objectContaining({
					qs: expect.objectContaining({
						start_date: '2025-01-15',
						end_date: '2025-02-15',
					}),
				}),
			);
		});

		it('should omit empty date params', async () => {
			const ctx = createMockExecuteFunctions({
				resource: 'chat',
				operation: 'getAll',
				projectId: 'proj-1',
				startDate: '',
				endDate: '',
				returnAll: false,
				limit: 50,
				offset: 0,
			});
			const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
			httpMock.mockResolvedValueOnce({ data: [] });

			await node.execute.call(ctx);

			const callArgs = httpMock.mock.calls[0][2];
			expect(callArgs.qs.start_date).toBeUndefined();
			expect(callArgs.qs.end_date).toBeUndefined();
		});
	});

	describe('execute - chat getContent', () => {
		it('should encode chat ID in URL path', async () => {
			const ctx = createMockExecuteFunctions({
				resource: 'chat',
				operation: 'getContent',
				projectId: 'proj-1',
				chatId: 'chat/with spaces',
			});
			const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
			httpMock.mockResolvedValueOnce({ messages: [{ role: 'user', content: 'hello' }] });

			const result = await node.execute.call(ctx);

			expect(httpMock).toHaveBeenCalledWith(
				ctx,
				'peecAiApi',
				expect.objectContaining({
					url: 'https://api.peec.ai/customer/v1/chats/chat%2Fwith%20spaces/content',
				}),
			);
			expect(result[0][0].json).toEqual({ messages: [{ role: 'user', content: 'hello' }] });
		});
	});

	describe('execute - brandReport get', () => {
		it('should build POST body with dimensions, dates, and filters', async () => {
			const ctx = createMockExecuteFunctions({
				resource: 'brandReport',
				operation: 'get',
				projectId: 'proj-1',
				dimensions: ['model_id', 'tag_id'],
				startDate: '2025-01-01T00:00:00.000Z',
				endDate: '2025-01-31T00:00:00.000Z',
				filters: {
					filterValues: [
						{ field: 'brand_id', operator: 'in', values: 'b1, b2' },
					],
				},
			});
			const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
			httpMock.mockResolvedValueOnce({ data: [{ brand: 'test', visibility: 0.8 }] });

			const result = await node.execute.call(ctx);

			expect(httpMock).toHaveBeenCalledWith(
				ctx,
				'peecAiApi',
				expect.objectContaining({
					method: 'POST',
					url: 'https://api.peec.ai/customer/v1/reports/brands',
					body: {
						project_id: 'proj-1',
						dimensions: ['model_id', 'tag_id'],
						start_date: '2025-01-01',
						end_date: '2025-01-31',
						filters: [
							{ field: 'brand_id', operator: 'in', values: ['b1', 'b2'] },
						],
					},
				}),
			);
			expect(result[0][0].json).toEqual({ brand: 'test', visibility: 0.8 });
		});

		it('should handle empty filters and dimensions', async () => {
			const ctx = createMockExecuteFunctions({
				resource: 'brandReport',
				operation: 'get',
				projectId: 'proj-1',
				dimensions: [],
				startDate: '',
				endDate: '',
				filters: {},
			});
			const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
			httpMock.mockResolvedValueOnce({ data: [] });

			await node.execute.call(ctx);

			const body = httpMock.mock.calls[0][2].body;
			expect(body.dimensions).toBeUndefined();
			expect(body.start_date).toBeUndefined();
			expect(body.filters).toBeUndefined();
		});
	});

	describe('execute - searchQuery get', () => {
		it('should POST to /queries/search with limit, offset, and filters', async () => {
			const ctx = createMockExecuteFunctions({
				resource: 'searchQuery',
				operation: 'get',
				projectId: 'proj-1',
				startDate: '2025-03-01T00:00:00.000Z',
				endDate: '2025-03-15T00:00:00.000Z',
				queryLimit: 25,
				queryOffset: 10,
				dimensions: ['model_id'],
				filters: {
					filterValues: [
						{ field: 'model_id', operator: 'not_in', values: 'gpt-4o' },
					],
				},
			});
			const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
			httpMock.mockResolvedValueOnce({ data: [{ query: 'best seo tools' }] });

			const result = await node.execute.call(ctx);

			expect(httpMock).toHaveBeenCalledWith(
				ctx,
				'peecAiApi',
				expect.objectContaining({
					method: 'POST',
					url: 'https://api.peec.ai/customer/v1/queries/search',
					body: expect.objectContaining({
						limit: 25,
						offset: 10,
						filters: [{ field: 'model_id', operator: 'not_in', values: ['gpt-4o'] }],
					}),
				}),
			);
			expect(result[0][0].json).toEqual({ query: 'best seo tools' });
		});
	});

	describe('execute - shoppingQuery get', () => {
		it('should POST to /queries/shopping', async () => {
			const ctx = createMockExecuteFunctions({
				resource: 'shoppingQuery',
				operation: 'get',
				projectId: 'proj-1',
				startDate: '',
				endDate: '',
				queryLimit: 50,
				queryOffset: 0,
				dimensions: [],
				filters: {},
			});
			const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
			httpMock.mockResolvedValueOnce({ data: [{ query: 'buy shoes' }] });

			await node.execute.call(ctx);

			expect(httpMock).toHaveBeenCalledWith(
				ctx,
				'peecAiApi',
				expect.objectContaining({
					url: 'https://api.peec.ai/customer/v1/queries/shopping',
				}),
			);
		});
	});

	describe('execute - domainReport and urlReport', () => {
		it('should use correct report path for domainReport', async () => {
			const ctx = createMockExecuteFunctions({
				resource: 'domainReport',
				operation: 'get',
				projectId: 'proj-1',
				dimensions: [],
				startDate: '',
				endDate: '',
				filters: {},
			});
			const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
			httpMock.mockResolvedValueOnce({ data: [] });

			await node.execute.call(ctx);

			expect(httpMock).toHaveBeenCalledWith(
				ctx,
				'peecAiApi',
				expect.objectContaining({
					url: 'https://api.peec.ai/customer/v1/reports/domains',
				}),
			);
		});

		it('should use correct report path for urlReport', async () => {
			const ctx = createMockExecuteFunctions({
				resource: 'urlReport',
				operation: 'get',
				projectId: 'proj-1',
				dimensions: [],
				startDate: '',
				endDate: '',
				filters: {},
			});
			const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
			httpMock.mockResolvedValueOnce({ data: [] });

			await node.execute.call(ctx);

			expect(httpMock).toHaveBeenCalledWith(
				ctx,
				'peecAiApi',
				expect.objectContaining({
					url: 'https://api.peec.ai/customer/v1/reports/urls',
				}),
			);
		});
	});

	describe('execute - error handling', () => {
		it('should throw NodeOperationError for unsupported resource/operation', async () => {
			const ctx = createMockExecuteFunctions({
				resource: 'unknown',
				operation: 'unknown',
			});

			await expect(node.execute.call(ctx)).rejects.toThrow('Unsupported resource/operation');
		});

		it('should return error item when continueOnFail is true', async () => {
			const ctx = createMockExecuteFunctions({
				resource: 'project',
				operation: 'getAll',
				returnAll: false,
				limit: 10,
				offset: 0,
			});
			(ctx.continueOnFail as ReturnType<typeof vi.fn>).mockReturnValue(true);
			const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
			httpMock.mockRejectedValueOnce(new Error('API timeout'));

			const result = await node.execute.call(ctx);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toEqual({ error: 'API timeout' });
			expect(result[0][0].pairedItem).toBe(0);
		});
	});

	describe('execute - multiple input items', () => {
		it('should process each input item independently', async () => {
			const ctx = createMockExecuteFunctions({
				resource: 'project',
				operation: 'getAll',
				returnAll: false,
				limit: 10,
				offset: 0,
			});
			(ctx.getInputData as ReturnType<typeof vi.fn>).mockReturnValue([{ json: {} }, { json: {} }]);
			const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
			httpMock
				.mockResolvedValueOnce({ data: [{ id: 'a' }] })
				.mockResolvedValueOnce({ data: [{ id: 'b' }] });

			const result = await node.execute.call(ctx);

			expect(result[0]).toHaveLength(2);
			expect(result[0][0].json).toEqual({ id: 'a' });
			expect(result[0][0].pairedItem).toBe(0);
			expect(result[0][1].json).toEqual({ id: 'b' });
			expect(result[0][1].pairedItem).toBe(1);
		});
	});

	describe('execute - filter parsing', () => {
		it('should trim whitespace and filter empty values from comma-separated filter values', async () => {
			const ctx = createMockExecuteFunctions({
				resource: 'brandReport',
				operation: 'get',
				projectId: 'proj-1',
				dimensions: [],
				startDate: '',
				endDate: '',
				filters: {
					filterValues: [
						{ field: 'brand_id', operator: 'in', values: ' v1 , v2 , , v3 ' },
					],
				},
			});
			const httpMock = ctx.helpers.httpRequestWithAuthentication as ReturnType<typeof vi.fn>;
			httpMock.mockResolvedValueOnce({ data: [] });

			await node.execute.call(ctx);

			const body = httpMock.mock.calls[0][2].body;
			expect(body.filters[0].values).toEqual(['v1', 'v2', 'v3']);
		});
	});

	describe('loadOptions - getProjects', () => {
		it('should return project options from API', async () => {
			const httpRequestWithAuthentication = vi.fn();
			const mockCtx = {
				helpers: {
					httpRequestWithAuthentication: Object.assign(httpRequestWithAuthentication, {
						call: httpRequestWithAuthentication,
					}),
				},
			} as unknown as ILoadOptionsFunctions;

			httpRequestWithAuthentication.mockResolvedValueOnce({
				data: [
					{ id: 'p1', name: 'Project Alpha' },
					{ id: 'p2', name: 'Project Beta' },
				],
			});

			const result = await node.methods.loadOptions.getProjects.call(mockCtx);

			expect(result).toEqual([
				{ name: 'Project Alpha', value: 'p1' },
				{ name: 'Project Beta', value: 'p2' },
			]);
			expect(httpRequestWithAuthentication).toHaveBeenCalledWith(
				mockCtx,
				'peecAiApi',
				expect.objectContaining({
					url: 'https://api.peec.ai/customer/v1/projects',
					timeout: 30_000,
				}),
			);
		});
	});
});
