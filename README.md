# @ringpublishing/graphql-api-client

Ring Content API Client and Websites API Client will help you to use Ring GraphQL APIs.
All you need is your Space UUID and access/secret API keys.

## Requirements

Make sure you have `NodeJS` installed and running in version `14` or above.

## Installation

When you have your node running, install our library by running the command:

```shell
npm install @ringpublishing/graphql-api-client
```

## Introduction
Two clients are available:
- WebsitesApiClientBuilder (api version 2) for Websites API
- ContentApiClientBuilder (api version 2) for Content API

## Usage

Look how easy is to use Ring GQL API using this library.

```typescript
import { WebsitesApiClientBuilder } from '@ringpublishing/graphql-api-client';
import { gql } from 'graphql-tag';

const accessKey = process.env.ACCESS_KEY!;
const secretKey = process.env.SECRET_KEY!;
const spaceUuid = process.env.SPACE_UUID!;

console.log('ARGUMENTS:', space, access, secret);

const query = gql`
    query {
        name,
        stories(limit: 2) {
            edges {
                node {
                    title
                }
            }
        }
    }
`;

type StoriesResponse = {
    stories: {
        edges: [{
            node: {
                title: string
            }
        }]
    }
};
type Variables = Record<string, unknown>;

const websitesApiClient = new WebsitesApiClientBuilder({ accessKey, secretKey, spaceUuid }).buildApolloClient();

try {
    const response = await websitesApiClient.query<StoriesResponse, Variables>({ query });
    console.log('Data:', response.data.stories);
} catch (err) {
    console.error('Error:', err);
}
```

## Reference

```
class WebsitesApiClientBuilder or ContentApiClientBuilder

    constructor:
    {
        spaceUuid (UUIDv4 string) - Websites Space UUID
        accessKey (UUIDv4 string) - Access Key
        secretKey (UUIDv4 string) - Secret Key
    } 

    methods:
        buildApolloClient(): ApolloClient<NormalizedCacheObject>: Return ApolloClient with defined params
        buildGotClient(): Got: Return Got with defined params
        setTimeout(timeout: number): Set timeout (default is 1000ms)
        setRetry(retry: RingGqlApiClientRetryOptions): set retry options (default is: { delay: 1000ms, maxAttempts: 3 })
        setCache(cache: ApolloCache<NormalizedCacheObject>): (only ApolloClient) set cache option (default used Apollo InMemoryCache)
        setBatch(batch: RingGqlApiClientBatchOptions): (only ApolloClient) set batch options, when you need to use batch calls, example: { batchMax: 5, batchInterval: 20 })
             - batchMax: No more than 5 operations per batch (default 5)
             - batchInterval: Wait no more than 20ms after first batched operation (default 20ms)
        setApiHost(apiHost: string): set API host (default is: api.ringpublishing.com)
        setApiProtocol(apiProtocol: RingGqlApiProtocol): set api protocol (default is RingGqlApiProtocol.HTTPS)
        setApolloClientAdditionalOptions(options: ApolloClientOptions<NormalizedCacheObject>): set additional options for ApolloClient
```
