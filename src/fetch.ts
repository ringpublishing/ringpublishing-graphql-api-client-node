import { default as fetchAws4 } from 'fetch-aws4';
import { RequestInfo, Response } from 'node-fetch';
import { V4RequestInit } from 'fetch-aws4/dist/types';

const customFetch = (url: RequestInfo, init?: V4RequestInit): Promise<Response> => {
    return fetchAws4.apply(fetchAws4, [url, init]);
};

export default customFetch;
