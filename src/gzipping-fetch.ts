import { RequestInfo, Response } from 'node-fetch';
import { V4RequestInit } from 'fetch-aws4/dist/types';
import { gzip } from 'zlib';
import { promisify } from 'util';
import customFetch from './fetch';

interface V4RequestInitExtended extends Omit<V4RequestInit, 'body'> {
    body?: string | Buffer | undefined;
}

const gzipAsync = promisify(gzip);

export const gzippingFetch = async (url: RequestInfo, init?: V4RequestInitExtended): Promise<Response> => {
    const newInit: V4RequestInitExtended = {
        ...init,
        headers: {
            ...init?.headers
        } };

    if (newInit?.body) {
        const gzippedBody = await gzipAsync(newInit.body);
        newInit.body = gzippedBody;

        if (!newInit.headers) {
            newInit.headers = {};
        }

        newInit.headers['content-encoding'] = 'gzip';
    }

    return customFetch(url, newInit as V4RequestInit); //Minor type fraud to pass Buffer as body
};

export default gzippingFetch;
