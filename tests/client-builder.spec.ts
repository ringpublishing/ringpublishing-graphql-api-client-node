import { WebsitesApiClientBuilder } from '../src';
import { gql } from 'graphql-tag';
import customFetch from '../src/fetch';
import { Response } from 'node-fetch';
// eslint-disable-next-line
// @ts-ignore
import { name, version } from '../package.json';

jest.mock('../src/fetch');

describe('Ring GQL API client', () => {
    const response = {
        data: {
            name: 'Ucs2SetupAws01',
            stories: {
                edges: [
                    {
                        node: {
                            title: 'ipsum magna consequat'
                        }
                    },
                    {
                        node: {
                            title: 'some title'
                        }
                    }
                ]
            }
        }
    };

    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(new Date('2020-01-01'));
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it('should throw exception when constructor variables are not defined', () => {
        expect(() => {
            new WebsitesApiClientBuilder({
                // @ts-expect-error we use this library in mostly in JS, and we need to test it
                spaceUuid: null, secretKey: undefined, accessKey: ''
            });
        }).toThrow('Variables spaceUuid, secretKey and accessKey are required');
    });

    it('should call gql query to api', async () => {
        const mockedFetch = jest.mocked(customFetch);

        mockedFetch.mockImplementation(() => {
            return Promise.resolve({
                ok: true,
                status: 200,
                text: () => Promise.resolve(JSON.stringify(response))
            } as unknown as Response);
        });

        const client = new WebsitesApiClientBuilder({
            accessKey: 'accessKey',
            secretKey: 'secretKey',
            spaceUuid: 'spaceUuid'
        }).buildApolloClient();

        const query = gql`
            query {
                name
                stories(limit: 2) {
                    edges {
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const result = await client.query({ query });

        expect(result).toMatchInlineSnapshot(`
            {
              "data": {
                "name": "Ucs2SetupAws01",
                "stories": {
                  "edges": [
                    {
                      "node": {
                        "title": "ipsum magna consequat",
                      },
                    },
                    {
                      "node": {
                        "title": "some title",
                      },
                    },
                  ],
                },
              },
              "loading": false,
              "networkStatus": 7,
            }
        `);
        expect(mockedFetch).toHaveBeenCalledWith(
            'https://api.ringpublishing.com/websites/v2/spaceUuid',
            {
                // eslint-disable-next-line max-len
                body: '{"variables":{},"query":"{\\n  name\\n  stories(limit: 2) {\\n    edges {\\n      node {\\n        title\\n        __typename\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n}"}',
                credentials: {
                    accessKeyId: 'accessKey',
                    secretAccessKey: 'secretKey'
                },
                headers: {
                    'accept': '*/*',
                    'apollographql-client-name': name,
                    'apollographql-client-version': version,
                    'content-type': 'application/json'
                },
                method: 'POST',
                region: 'eu-central-1',
                service: 'execute-api'
            }
        );
    });
});
