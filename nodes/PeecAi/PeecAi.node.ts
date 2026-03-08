import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

const BASE_URL = 'https://api.peec.ai/customer/v1';

export class PeecAi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Peec AI',
		name: 'peecAi',
		icon: 'file:peecAi.svg',
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Monitor and analyze your brand visibility across AI search engines like ChatGPT, Perplexity, Gemini, and others. Track citations, sentiment, and competitive positioning.',
		defaults: {
			name: 'Peec AI',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'peecAiApi',
				required: true,
			},
		],
		properties: [
			// ------ Resource ------
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Brand', value: 'brand', description: 'Tracked brands and their domains' },
					{ name: 'Brand Report', value: 'brandReport', description: 'Brand visibility, sentiment, and position analytics' },
					{ name: 'Chat', value: 'chat', description: 'AI chat interactions tracked by Peec AI' },
					{ name: 'Domain Report', value: 'domainReport', description: 'Domain citation and visibility analytics' },
					{ name: 'Model', value: 'model', description: 'AI models being monitored' },
					{ name: 'Project', value: 'project', description: 'Peec AI monitoring projects' },
					{ name: 'Prompt', value: 'prompt', description: 'Search prompts used for monitoring' },
					{ name: 'Tag', value: 'tag', description: 'Tags for organizing prompts and reports' },
					{ name: 'Topic', value: 'topic', description: 'Topic categories for analysis' },
					{ name: 'URL Report', value: 'urlReport', description: 'URL-level citation and visibility analytics' },
				],
				default: 'project',
			},

			// ------ Operations ------

			// Project
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['project'] } },
				options: [
					{ name: 'Get Many', value: 'getAll', action: 'List all projects' },
				],
				default: 'getAll',
			},

			// Brand
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['brand'] } },
				options: [
					{ name: 'Get Many', value: 'getAll', action: 'List tracked brands for a project' },
				],
				default: 'getAll',
			},

			// Prompt
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['prompt'] } },
				options: [
					{ name: 'Get Many', value: 'getAll', action: 'List search prompts for a project' },
				],
				default: 'getAll',
			},

			// Tag
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['tag'] } },
				options: [
					{ name: 'Get Many', value: 'getAll', action: 'List tags for a project' },
				],
				default: 'getAll',
			},

			// Topic
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['topic'] } },
				options: [
					{ name: 'Get Many', value: 'getAll', action: 'List topics for a project' },
				],
				default: 'getAll',
			},

			// Model
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['model'] } },
				options: [
					{ name: 'Get Many', value: 'getAll', action: 'List monitored AI models' },
				],
				default: 'getAll',
			},

			// Chat
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['chat'] } },
				options: [
					{ name: 'Get Many', value: 'getAll', action: 'List AI chat interactions' },
					{ name: 'Get Content', value: 'getContent', action: 'Get full content of a chat' },
				],
				default: 'getAll',
			},

			// Brand Report
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['brandReport'] } },
				options: [
					{ name: 'Get', value: 'get', action: 'Get brand visibility and sentiment report' },
				],
				default: 'get',
			},

			// Domain Report
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['domainReport'] } },
				options: [
					{ name: 'Get', value: 'get', action: 'Get domain citation report' },
				],
				default: 'get',
			},

			// URL Report
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: { show: { resource: ['urlReport'] } },
				options: [
					{ name: 'Get', value: 'get', action: 'Get URL citation report' },
				],
				default: 'get',
			},

			// ------ Parameters ------

			// Project ID — required for all resources except project
			{
				displayName: 'Project Name or ID',
				name: 'projectId',
				type: 'options',
				typeOptions: { loadOptionsMethod: 'getProjects' },
				required: true,
				default: '',
				description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
				displayOptions: {
					show: {
						resource: ['brand', 'prompt', 'tag', 'topic', 'model', 'chat', 'brandReport', 'domainReport', 'urlReport'],
					},
				},
			},

			// Chat ID — for get content
			{
				displayName: 'Chat ID',
				name: 'chatId',
				type: 'string',
				required: true,
				default: '',
				description: 'The ID of the chat to get content for',
				displayOptions: {
					show: { resource: ['chat'], operation: ['getContent'] },
				},
			},

			// Return All — for all getAll operations
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				description: 'Whether to return all results or only up to a given limit',
				displayOptions: {
					show: { operation: ['getAll'] },
				},
			},

			// Limit — shown only when returnAll is false
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 50,
				description: 'Max number of results to return',
				displayOptions: {
					show: { operation: ['getAll'], returnAll: [false] },
				},
			},
			{
				displayName: 'Offset',
				name: 'offset',
				type: 'number',
				typeOptions: { minValue: 0 },
				default: 0,
				description: 'Number of results to skip (for pagination)',
				displayOptions: {
					show: { operation: ['getAll'], returnAll: [false] },
				},
			},

			// Date filters — for chats and reports
			{
				displayName: 'Start Date',
				name: 'startDate',
				type: 'dateTime',
				typeOptions: { dateOnly: true },
				default: '',
				description: 'Filter from this date (inclusive)',
				displayOptions: {
					show: {
						resource: ['chat', 'brandReport', 'domainReport', 'urlReport'],
					},
					hide: { operation: ['getContent'] },
				},
			},
			{
				displayName: 'End Date',
				name: 'endDate',
				type: 'dateTime',
				typeOptions: { dateOnly: true },
				default: '',
				description: 'Filter until this date (inclusive)',
				displayOptions: {
					show: {
						resource: ['chat', 'brandReport', 'domainReport', 'urlReport'],
					},
					hide: { operation: ['getContent'] },
				},
			},

			// Dimensions — for reports
			{
				displayName: 'Dimensions',
				name: 'dimensions',
				type: 'multiOptions',
				options: [
					{ name: 'Model', value: 'model_id', description: 'Break down by AI model (ChatGPT, Perplexity, etc.)' },
					{ name: 'Prompt', value: 'prompt_id', description: 'Break down by search prompt' },
					{ name: 'Tag', value: 'tag_id', description: 'Break down by tag' },
					{ name: 'Topic', value: 'topic_id', description: 'Break down by topic category' },
				],
				default: [],
				description: 'Break down results by these dimensions',
				displayOptions: {
					show: {
						resource: ['brandReport', 'domainReport', 'urlReport'],
					},
				},
			},

			// Filters — for reports
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true },
				default: {},
				description: 'Filter report data by specific fields',
				displayOptions: {
					show: {
						resource: ['brandReport', 'domainReport', 'urlReport'],
					},
				},
				options: [
					{
						name: 'filterValues',
						displayName: 'Filter',
						values: [
							{
								displayName: 'Field',
								name: 'field',
								type: 'options',
								options: [
									{ name: 'Brand', value: 'brand_id' },
									{ name: 'Classification', value: 'classification' },
									{ name: 'Model', value: 'model_id' },
									{ name: 'Prompt', value: 'prompt_id' },
									{ name: 'Tag', value: 'tag_id' },
									{ name: 'Topic', value: 'topic_id' },
								],
								default: 'brand_id',
								description: 'The field to filter on',
							},
							{
								displayName: 'Operator',
								name: 'operator',
								type: 'options',
								options: [
									{ name: 'In', value: 'in' },
									{ name: 'Not In', value: 'not_in' },
								],
								default: 'in',
							},
							{
								displayName: 'Values',
								name: 'values',
								type: 'string',
								default: '',
								placeholder: 'value1, value2',
								description: 'Comma-separated list of values',
							},
						],
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getProjects(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const response = await this.helpers.httpRequestWithAuthentication.call(this, 'peecAiApi', {
					method: 'GET' as IHttpRequestMethods,
					url: `${BASE_URL}/projects`,
					qs: { limit: 100 },
					json: true,
				});
				const projects = (response as { data: Array<{ id: string; name: string }> }).data;
				return projects.map((p) => ({
					name: p.name,
					value: p.id,
				}));
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				let responseData: unknown;

				if (resource === 'project' && operation === 'getAll') {
					responseData = await getAllItems.call(this, i, '/projects');
				}

				else if (resource === 'brand' && operation === 'getAll') {
					const projectId = this.getNodeParameter('projectId', i) as string;
					responseData = await getAllItems.call(this, i, '/brands', { project_id: projectId });
				}

				else if (resource === 'prompt' && operation === 'getAll') {
					const projectId = this.getNodeParameter('projectId', i) as string;
					responseData = await getAllItems.call(this, i, '/prompts', { project_id: projectId });
				}

				else if (resource === 'tag' && operation === 'getAll') {
					const projectId = this.getNodeParameter('projectId', i) as string;
					responseData = await getAllItems.call(this, i, '/tags', { project_id: projectId });
				}

				else if (resource === 'topic' && operation === 'getAll') {
					const projectId = this.getNodeParameter('projectId', i) as string;
					responseData = await getAllItems.call(this, i, '/topics', { project_id: projectId });
				}

				else if (resource === 'model' && operation === 'getAll') {
					const projectId = this.getNodeParameter('projectId', i) as string;
					responseData = await getAllItems.call(this, i, '/models', { project_id: projectId });
				}

				else if (resource === 'chat' && operation === 'getAll') {
					const projectId = this.getNodeParameter('projectId', i) as string;
					const extraQs: IDataObject = { project_id: projectId };
					const startDate = this.getNodeParameter('startDate', i) as string;
					const endDate = this.getNodeParameter('endDate', i) as string;
					if (startDate) extraQs.start_date = startDate.substring(0, 10);
					if (endDate) extraQs.end_date = endDate.substring(0, 10);
					responseData = await getAllItems.call(this, i, '/chats', extraQs);
				}

				else if (resource === 'chat' && operation === 'getContent') {
					const projectId = this.getNodeParameter('projectId', i) as string;
					const chatId = this.getNodeParameter('chatId', i) as string;
					responseData = await apiRequestRaw.call(this, 'GET', `/chats/${encodeURIComponent(chatId)}/content`, { project_id: projectId });
				}

				else if (['brandReport', 'domainReport', 'urlReport'].includes(resource) && operation === 'get') {
					const projectId = this.getNodeParameter('projectId', i) as string;
					const reportPath: Record<string, string> = {
						brandReport: 'brands',
						domainReport: 'domains',
						urlReport: 'urls',
					};
					const body: IDataObject = { project_id: projectId };

					const dimensions = this.getNodeParameter('dimensions', i) as string[];
					if (dimensions.length > 0) body.dimensions = dimensions;

					const startDate = this.getNodeParameter('startDate', i) as string;
					const endDate = this.getNodeParameter('endDate', i) as string;
					if (startDate) body.start_date = startDate.substring(0, 10);
					if (endDate) body.end_date = endDate.substring(0, 10);

					const filtersParam = this.getNodeParameter('filters', i) as {
						filterValues?: Array<{ field: string; operator: string; values: string }>;
					};
					if (filtersParam.filterValues && filtersParam.filterValues.length > 0) {
						body.filters = filtersParam.filterValues.map((f) => ({
							field: f.field,
							operator: f.operator,
							values: f.values.split(',').map((v) => v.trim()).filter((v) => v !== ''),
						}));
					}

					responseData = await apiRequestPost.call(
						this,
						`/reports/${reportPath[resource]}`,
						body,
					);
				}

				else {
					throw new NodeOperationError(
						this.getNode(),
						`Unsupported resource/operation: ${resource}/${operation}`,
						{ itemIndex: i },
					);
				}

				// Normalize to array
				const results = Array.isArray(responseData) ? responseData : [responseData];
				returnData.push(...results.map((item) => ({ json: item as IDataObject, pairedItem: i })));

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: i });
				} else {
					if ((error as { response?: unknown }).response) {
						throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
					}
					throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
				}
			}
		}

		return [returnData];
	}
}

/**
 * Handle returnAll pagination or limited fetch for getAll operations.
 */
async function getAllItems(
	this: IExecuteFunctions,
	itemIndex: number,
	path: string,
	extraQs?: IDataObject,
): Promise<unknown[]> {
	const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;

	if (returnAll) {
		const allResults: unknown[] = [];
		let offset = 0;
		const batchSize = 100;
		let batch: unknown;
		do {
			batch = await apiRequest.call(this, 'GET', path, { ...extraQs, limit: batchSize, offset });
			if (!Array.isArray(batch)) {
				throw new NodeOperationError(
					this.getNode(),
					`Unexpected API response for ${path}: expected array`,
					{ itemIndex },
				);
			}
			allResults.push(...batch);
			offset += batchSize;
		} while (batch.length === batchSize);
		return allResults;
	}

	const limit = this.getNodeParameter('limit', itemIndex) as number;
	const offsetParam = this.getNodeParameter('offset', itemIndex) as number;
	const result = await apiRequest.call(this, 'GET', path, { ...extraQs, limit, offset: offsetParam });
	return Array.isArray(result) ? result : [result];
}

/** GET request — unwraps { data: T } envelope. */
async function apiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	path: string,
	qs?: IDataObject,
): Promise<unknown> {
	const response = await this.helpers.httpRequestWithAuthentication.call(this, 'peecAiApi', {
		method,
		url: `${BASE_URL}${path}`,
		qs,
		json: true,
	});
	return (response as { data: unknown }).data;
}

/** GET request — returns response body directly (no envelope). */
async function apiRequestRaw(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	path: string,
	qs?: IDataObject,
): Promise<unknown> {
	return this.helpers.httpRequestWithAuthentication.call(this, 'peecAiApi', {
		method,
		url: `${BASE_URL}${path}`,
		qs,
		json: true,
	});
}

/** POST request — unwraps { data: T } envelope. */
async function apiRequestPost(
	this: IExecuteFunctions,
	path: string,
	body: IDataObject,
): Promise<unknown> {
	const response = await this.helpers.httpRequestWithAuthentication.call(this, 'peecAiApi', {
		method: 'POST',
		url: `${BASE_URL}${path}`,
		body,
		json: true,
	});
	return (response as { data: unknown }).data;
}
