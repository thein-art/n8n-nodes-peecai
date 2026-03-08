import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class PeecAiApi implements ICredentialType {
	name = 'peecAiApi';

	displayName = 'Peec.ai API';

	documentationUrl = 'https://github.com/thein-art/n8n-nodes-peecai#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'API key from app.peec.ai → Settings → API Keys',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-API-Key': '={{$credentials?.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.peec.ai/customer/v1',
			url: '/projects',
			qs: { limit: 1 },
			method: 'GET',
		},
	};
}
