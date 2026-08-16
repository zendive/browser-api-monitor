import type { ITrace } from '../../../wrapper/shared/Tracer.ts';

enum ETraceDomain {
  UNKNOWN,
  SAME,
  EXTERNAL,
  EXTENSION,
  SNIPPET,
  WEBPACK,
  URI_DATA,
}

const REGEX_STACKTRACE_LINK_PROTOCOL = /*@__PURE__*/ new RegExp(
  /^http[s]?:\/+/i,
);

function getDomain(trace: ITrace[], locationOrigin: string) {
  const firstLink = trace[0]?.link || '';

  if (locationOrigin && firstLink.startsWith(locationOrigin)) {
    return ETraceDomain.SAME;
  } else if (REGEX_STACKTRACE_LINK_PROTOCOL.test(firstLink)) {
    return ETraceDomain.EXTERNAL;
  } else if (firstLink.startsWith('chrome-extension://')) {
    return ETraceDomain.EXTENSION;
  } else if (firstLink.startsWith('snippet:///')) {
    return ETraceDomain.SNIPPET;
  } else if (firstLink.startsWith('webpack://')) {
    return ETraceDomain.WEBPACK;
  } else if (firstLink.startsWith('data:')) {
    return ETraceDomain.URI_DATA;
  }

  return ETraceDomain.UNKNOWN;
}

interface IDomainDescriptor {
  name: string;
  icon: string;
}

const traceDomainUIMap: Map<ETraceDomain, IDomainDescriptor> =
  /*@__PURE__*/ (() =>
    new Map([
      [ETraceDomain.UNKNOWN, { icon: '', name: 'Unknown trace origin' }],
      [ETraceDomain.SAME, { icon: '-trace-local', name: 'Same domain' }],
      [ETraceDomain.EXTERNAL, {
        icon: '-trace-external',
        name: 'External domain',
      }],
      [ETraceDomain.EXTENSION, { icon: '-trace-extension', name: 'Extension' }],
      [ETraceDomain.SNIPPET, { icon: '-trace-extension', name: 'Snippet' }],
      [ETraceDomain.WEBPACK, { icon: '-trace-webpack', name: 'Webpack' }],
      [ETraceDomain.URI_DATA, { icon: '-trace-uri-data', name: 'data: URI' }],
    ]))();

export function getDomainDescriptor(
  trace: ITrace[],
  locationOrigin: string,
): IDomainDescriptor {
  const traceDomain = getDomain(trace, locationOrigin);
  return traceDomainUIMap.get(traceDomain) || { icon: '', name: '' };
}
