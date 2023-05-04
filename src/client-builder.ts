import * as ApolloClientCore from '@apollo/client/core';
import ApolloLinkTimeout from 'apollo-link-timeout';
import customFetch from './fetch';
import got, { Got } from 'got';
import { ApolloCache } from '@apollo/client/cache/core/cache';
import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client/core';
import { BatchHttpLink } from '@apollo/client/link/batch-http';
import { HttpRequest } from '@aws-sdk/protocol-http';
import { NormalizedCacheObject } from '@apollo/client/cache/inmemory/types';
import { Options } from 'got/dist/source/as-promise/types';
import { RetryLink } from '@apollo/client/link/retry';
import { Sha256 } from '@aws-crypto/sha256-js';
import { SignatureV4 } from '@aws-sdk/signature-v4';
import { URL } from 'url';
// eslint-disable-next-line
// @ts-ignore
import { name, version } from '../package.json';
import { ExtendOptions } from 'got/dist/source/types';
import { ApolloClientOptions } from '@apollo/client/core/ApolloClient';

const API_HOSTNAME = 'api.ringpublishing.com';
const DEFAULT_TIMEOUT = 1000;

export enum RingGqlApiProtocol {
    HTTP = 'http',
    HTTPS = 'https'
}

export enum RingGqlApiType {
    CONTENT = 'content',
    WEBSITES = 'websites'
}

export interface RingGqlApiClientRetryOptions {
    delay: number;
    maxAttempts: number;
}

export interface RingGqlApiClientBatchOptions {
    batchMax?: number;
    batchInterval?: number;
}

export interface RingGqlApiClientBuilderCreateParams {
    spaceUuid: string;

    accessKey: string;

    secretKey: string;
}

export abstract class RingGqlClientBuilder {
    protected abstract readonly apiType: RingGqlApiType;

    protected abstract readonly apiVersion: number;

    private readonly spaceUuid: string;

    private readonly accessKey: string;

    private readonly secretKey: string;

    private apiHost: string = API_HOSTNAME;

    private apiProtocol: RingGqlApiProtocol = RingGqlApiProtocol.HTTPS;

    private timeout: number = DEFAULT_TIMEOUT;

    private cache: ApolloCache<NormalizedCacheObject> = new InMemoryCache();

    private apolloOptions: ApolloClientOptions<NormalizedCacheObject> | undefined;

    private batch?: RingGqlApiClientBatchOptions;

    private retry: RingGqlApiClientRetryOptions = {
        delay: 1000,
        maxAttempts: 3
    };

    constructor({ spaceUuid, secretKey, accessKey }: RingGqlApiClientBuilderCreateParams) {
        if ([spaceUuid, secretKey, accessKey].some(i => !i)) {
            throw new Error('Variables spaceUuid, secretKey and accessKey are required');
        }

        this.spaceUuid = spaceUuid;
        this.secretKey = secretKey;
        this.accessKey = accessKey;
    }

    private get url(): URL {
        return new URL(`${this.apiProtocol}://${this.apiHost}/${this.apiType}/v${this.apiVersion}/${this.spaceUuid}`);
    }

    private getFetchConfig(): Record<string, unknown> {
        return {
            fetch: customFetch,
            fetchOptions: {
                credentials: {
                    accessKeyId: this.accessKey,
                    secretAccessKey: this.secretKey
                },
                region: 'eu-central-1',
                service: 'execute-api'
            }
        };
    }

    private getRetryLink(): RetryLink {
        return new RetryLink({
            delay: {
                initial: this.retry.delay
            },
            attempts: {
                max: this.retry.maxAttempts
            }
        });
    }

    private getDefaultClient(): ApolloClient<NormalizedCacheObject> {
        const additiveLink = ApolloClientCore.from([
            this.getRetryLink(),
            new ApolloLinkTimeout(this.timeout),
            this.getHttpLink()
        ]);

        return new ApolloClient({
            ssrMode: true,
            link: additiveLink,
            name,
            version,
            cache: this.cache,
            ...(this.apolloOptions !== undefined ? this.apolloOptions : {})
        });
    }

    private getBatchClient(): ApolloClient<NormalizedCacheObject> {
        const batchAdditiveLink = ApolloClientCore.from([
            this.getRetryLink(),
            new ApolloLinkTimeout(this.timeout),
            this.getBatchHttpLink()
        ]);

        return new ApolloClient({
            ssrMode: true,
            link: batchAdditiveLink,
            name: `${name}-batch`,
            version,
            cache: this.cache,
            ...(this.apolloOptions !== undefined ? this.apolloOptions : {})
        });
    }

    private getHttpLink(): HttpLink {
        return new HttpLink({
            uri: this.url.toString(),
            ...this.getFetchConfig()
        });
    }

    private getBatchHttpLink(): BatchHttpLink {
        return new BatchHttpLink({
            batchMax: this.batch?.batchMax ?? 5,
            batchInterval: this.batch?.batchInterval ?? 20,
            uri: this.url.toString(),
            ...this.getFetchConfig()
        });
    }

    private getSigner(): SignatureV4 {
        return new SignatureV4({
            credentials: {
                accessKeyId: this.accessKey,
                secretAccessKey: this.secretKey
            },
            region: 'eu-central-1',
            service: 'execute-api',
            sha256: Sha256
        });
    }

    public setTimeout(timeout: number): RingGqlClientBuilder {
        this.timeout = timeout;

        return this;
    }

    public setRetry(retry: RingGqlApiClientRetryOptions): RingGqlClientBuilder {
        this.retry = retry;

        return this;
    }

    public setApolloClientAdditionalOptions(options: ApolloClientOptions<NormalizedCacheObject>): RingGqlClientBuilder {
        this.apolloOptions = options;

        return this;
    }

    public setCache(cache: ApolloCache<NormalizedCacheObject>): RingGqlClientBuilder {
        this.cache = cache;

        return this;
    }

    public setBatch(batch: RingGqlApiClientBatchOptions): RingGqlClientBuilder {
        this.batch = batch;

        return this;
    }

    public setApiHost(apiHost: string): RingGqlClientBuilder {
        this.apiHost = apiHost;

        return this;
    }

    public withApiProtocol(apiProtocol: RingGqlApiProtocol): RingGqlClientBuilder {
        this.apiProtocol = apiProtocol;

        return this;
    }

    public buildApolloClient(): ApolloClient<NormalizedCacheObject> {
        if (this.batch) {
            return this.getBatchClient();
        }

        return this.getDefaultClient();
    }

    public buildGotClient(): Got {
        const customHeaders = {
            'accept': 'application/json',
            'content-type': 'application/json',
            'host': this.url.host
        };

        const settings: ExtendOptions = {
            hooks: {
                beforeRequest: [
                    async (options: Options): Promise<void> => {
                        const httpRequest = new HttpRequest({
                            hostname: this.url.hostname,
                            path: this.url.pathname,
                            protocol: this.url.protocol,
                            method: 'POST',
                            headers: customHeaders,
                            body: options.body
                        });
                        const { body, headers } = await this.getSigner().sign(httpRequest, { signingDate: new Date() });
                        // eslint-disable-next-line require-atomic-updates
                        options.headers = headers;
                        // eslint-disable-next-line require-atomic-updates
                        options.body = body;
                    }
                ]
            },
            headers: customHeaders,
            timeout: this.timeout,
            retry: this.retry.maxAttempts,
            method: 'POST',
            throwHttpErrors: false,
            url: this.url
        };

        return got.extend(settings);
    }
}
