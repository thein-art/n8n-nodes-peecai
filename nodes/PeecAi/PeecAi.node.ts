import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IHttpRequestMethods,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

const BASE_URL = 'https://api.peec.ai/customer/v1';

export class PeecAi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Peec.ai',
		name: 'peecAi',
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'AI Search Analytics — brand visibility, sentiment, and citations across ChatGPT, Perplexity, and other AI models',
		defaults: {
			name: 'Peec.ai',
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
					{ name: 'Brand', value: 'brand' },
					{ name: 'Brand Report', value: 'brandReport' },
					{ name: 'Chat', value: 'chat' },
					{ name: 'Domain Report', value: 'domainReport' },
					{ name: 'Model', value: 'model' },
					{ name: 'Project', value: 'project' },
					{ name: 'Prompt', value: 'prompt' },
					{ name: 'Tag', value: 'tag' },
					{ name: 'Topic', value: 'topic' },
					{ name: 'URL Report', value: 'urlReport' },
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
					{ name: 'Get Many', value: 'getAll', action: 'Get many projects' },
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
					{ name: 'Get Many', value: 'getAll', action: 'Get many brands' },
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
					{ name: 'Get Many', value: 'getAll', action: 'Get many prompts' },
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
					{ name: 'Get Many', value: 'getAll', action: 'Get many tags' },
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
					{ name: 'Get Many', value: 'getAll', action: 'Get many topics' },
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
					{ name: 'Get Many', value: 'getAll', action: 'Get many models' },
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
					{ name: 'Get Many', value: 'getAll', action: 'Get many chats' },
					{ name: 'Get Content', value: 'getContent', action: 'Get chat content' },
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
					{ name: 'Get', value: 'get', action: 'Get brand report' },
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
					{ name: 'Get', value: 'get', action: 'Get domain report' },
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
					{ name: 'Get', value: 'get', action: 'Get URL report' },
				],
				default: 'get',
			},

			// ------ Parameters ------

			// Project ID — required for all resources except project
			{
				displayName: 'Project ID',
				name: 'projectId',
				type: 'string',
				required: true,
				default: '',
				description: 'The Peec.ai project ID',
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
				description: 'The chat ID to retrieve',
				displayOptions: {
					show: { resource: ['chat'], operation: ['getContent'] },
				},
			},

			// Limit & Offset — for all getAll operations
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 1000 },
				default: 100,
				description: 'Max number of results to return',
				displayOptions: {
					show: { operation: ['getAll'] },
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
					show: { operation: ['getAll'] },
				},
			},

			// Date filters — for chats and reports
			{
				displayName: 'Start Date',
				name: 'startDate',
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD',
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
				type: 'string',
				default: '',
				placeholder: 'YYYY-MM-DD',
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
					{ name: 'Model', value: 'model_id' },
					{ name: 'Prompt', value: 'prompt_id' },
					{ name: 'Tag', value: 'tag_id' },
					{ name: 'Topic', value: 'topic_id' },
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
				description: 'Server-side filters for report data',
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
								type: 'string',
								default: '',
								placeholder: 'e.g. brand_id, classification',
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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: unknown;

				if (resource === 'project' && operation === 'getAll') {
					responseData = await apiRequest.call(this, 'GET', '/projects', {
						limit: this.getNodeParameter('limit', i) as number,
						offset: this.getNodeParameter('offset', i) as number,
					});
				}

				else if (resource === 'brand' && operation === 'getAll') {
					const projectId = this.getNodeParameter('projectId', i) as string;
					responseData = await apiRequest.call(this, 'GET', `/projects/${projectId}/brands`, {
						limit: this.getNodeParameter('limit', i) as number,
						offset: this.getNodeParameter('offset', i) as number,
					});
				}

				else if (resource === 'prompt' && operation === 'getAll') {
					const projectId = this.getNodeParameter('projectId', i) as string;
					responseData = await apiRequest.call(this, 'GET', `/projects/${projectId}/prompts`, {
						limit: this.getNodeParameter('limit', i) as number,
						offset: this.getNodeParameter('offset', i) as number,
					});
				}

				else if (resource === 'tag' && operation === 'getAll') {
					const projectId = this.getNodeParameter('projectId', i) as string;
					responseData = await apiRequest.call(this, 'GET', `/projects/${projectId}/tags`, {
						limit: this.getNodeParameter('limit', i) as number,
						offset: this.getNodeParameter('offset', i) as number,
					});
				}

				else if (resource === 'topic' && operation === 'getAll') {
					const projectId = this.getNodeParameter('projectId', i) as string;
					responseData = await apiRequest.call(this, 'GET', `/projects/${projectId}/topics`, {
						limit: this.getNodeParameter('limit', i) as number,
						offset: this.getNodeParameter('offset', i) as number,
					});
				}

				else if (resource === 'model' && operation === 'getAll') {
					const projectId = this.getNodeParameter('projectId', i) as string;
					responseData = await apiRequest.call(this, 'GET', `/projects/${projectId}/models`, {
						limit: this.getNodeParameter('limit', i) as number,
						offset: this.getNodeParameter('offset', i) as number,
					});
				}

				else if (resource === 'chat' && operation === 'getAll') {
					const projectId = this.getNodeParameter('projectId', i) as string;
					const qs: IDataObject = {
						limit: this.getNodeParameter('limit', i) as number,
						offset: this.getNodeParameter('offset', i) as number,
					};
					const startDate = this.getNodeParameter('startDate', i) as string;
					const endDate = this.getNodeParameter('endDate', i) as string;
					if (startDate) qs.start_date = startDate;
					if (endDate) qs.end_date = endDate;
					responseData = await apiRequest.call(this, 'GET', `/projects/${projectId}/chats`, qs);
				}

				else if (resource === 'chat' && operation === 'getContent') {
					const projectId = this.getNodeParameter('projectId', i) as string;
					const chatId = this.getNodeParameter('chatId', i) as string;
					// Chat content endpoint does not use the data envelope
					responseData = await apiRequestRaw.call(this, 'GET', `/projects/${projectId}/chats/${chatId}`);
				}

				else if (['brandReport', 'domainReport', 'urlReport'].includes(resource) && operation === 'get') {
					const projectId = this.getNodeParameter('projectId', i) as string;
					const reportPath: Record<string, string> = {
						brandReport: 'brands',
						domainReport: 'domains',
						urlReport: 'urls',
					};
					const body: IDataObject = {};

					const dimensions = this.getNodeParameter('dimensions', i) as string[];
					if (dimensions.length > 0) body.dimensions = dimensions;

					const startDate = this.getNodeParameter('startDate', i) as string;
					const endDate = this.getNodeParameter('endDate', i) as string;
					if (startDate) body.start_date = startDate;
					if (endDate) body.end_date = endDate;

					const filtersParam = this.getNodeParameter('filters', i) as {
						filterValues?: Array<{ field: string; operator: string; values: string }>;
					};
					if (filtersParam.filterValues && filtersParam.filterValues.length > 0) {
						body.filters = filtersParam.filterValues.map((f) => ({
							field: f.field,
							operator: f.operator,
							values: f.values.split(',').map((v) => v.trim()),
						}));
					}

					responseData = await apiRequestPost.call(
						this,
						`/projects/${projectId}/reports/${reportPath[resource]}`,
						body,
					);
				}

				// Normalize to array
				const results = Array.isArray(responseData) ? responseData : [responseData];
				returnData.push(...results.map((item) => ({ json: item as IDataObject })));

			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: (error as Error).message }, pairedItem: i });
				} else {
					throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
				}
			}
		}

		return [returnData];
	}
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
