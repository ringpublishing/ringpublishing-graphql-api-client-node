import { RingGqlApiType, RingGqlClientBuilder } from './client-builder';

export class VideosApiClientBuilder extends RingGqlClientBuilder {
    protected readonly apiType = RingGqlApiType.VIDEOS;

    protected readonly apiVersion = 1;
}
