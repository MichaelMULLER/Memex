import Storex, { FindManyOptions } from '@worldbrain/storex'
import {
    SearchBackend,
    AnnotSearchParams,
    PageSearchParams,
    SocialSearchParams,
} from './background/types'
import SearchStorage from './background/storage'
import { Bookmarks } from 'webextension-polyfill-ts'

export type DBGet = () => Promise<Storex>

export type SuggestOptions = FindManyOptions & { includePks?: boolean }
export type SuggestResult<S, P> = Array<{
    collection: string
    suggestion: S
    pk: P
}>

export type VisitInput = number
export type BookmarkInput = number
export type PageID = string
export type PageScore = number
export type SearchResult = [PageID, PageScore, number]
export type TermsIndexName = 'terms' | 'urlTerms' | 'titleTerms'
export type PageResultsMap = Map<PageID, PageScore>

export interface SearchParams {
    domains: string[]
    domainsExclude: string[]
    tags: string[]
    tagsExc: string[]
    terms: string[]
    termsExclude: string[]
    bookmarks: boolean
    endDate?: number
    startDate?: number
    skip?: number
    limit?: number
    lists: string[]
}

export interface FilteredIDs<T = string> {
    include: Set<T>
    exclude: Set<T>
    isAllowed(url: T): boolean
    isDataFiltered: boolean
}

export interface VisitInteraction {
    duration: number
    scrollPx: number
    scrollPerc: number
    scrollMaxPx: number
    scrollMaxPerc: number
}

export interface PageAddRequest {
    pageDoc: PageDoc
    visits: VisitInput[]
    bookmark: BookmarkInput
    rejectNoContent?: boolean
}

export interface PageDoc {
    content: Partial<PageContent>
    url: string
    favIconURI?: string
    screenshotURI?: string
    [extra: string]: any
}

export interface PageContent {
    fullText: string
    title: string
    lang?: string
    canonicalUrl?: string
    description?: string
    keywords?: string[]
}

export interface PipelineReq {
    pageDoc: PageDoc
    rejectNoContent?: boolean
}

export interface PipelineRes {
    url: string

    // Display data
    fullUrl: string
    fullTitle: string

    // Indexed data
    domain: string
    hostname: string
    tags: string[]
    terms: string[]
    urlTerms: string[]
    titleTerms: string[]

    // Misc.
    favIconURI?: string
    screenshotURI?: string
    text: string
}

export interface SearchIndex {
    search: (
        params: {
            query
            showOnlyBookmarks
            mapResultsFunc?
            domains?
            domainsExclude?
            tags?
            lists?
            [key: string]: any
        },
    ) => Promise<{
        docs
        isBadTerm?
        totalCount
        resultsExhausted: boolean
    }>
    getMatchingPageCount: (pattern) => Promise<any>
    fullSearch: (
        params: SearchParams,
    ) => Promise<{
        ids: Array<[string, number, number]>
        totalCount: number
    }>

    getPage: (url: string) => Promise<any>
    addPage: (params: Partial<PageAddRequest>) => Promise<void>
    addPageTerms: (pipelineReq: PipelineReq) => Promise<void>
    delPages: (urls: string[]) => Promise<{ info: any }[]>
    delPagesByDomain: (url: string) => Promise<any>
    delPagesByPattern: (pattern: string | RegExp) => Promise<any>

    addBookmark: (
        params: {
            url: string
            timestamp?: number
            tabId?: number
        },
    ) => Promise<void>
    delBookmark: (params: Partial<Bookmarks.BookmarkTreeNode>) => Promise<void>
    pageHasBookmark: (url: string) => Promise<boolean>

    updateTimestampMeta: (
        url: string,
        time: number,
        data: Partial<VisitInteraction>,
    ) => Promise<any>
    addVisit: (url: string, time?: number) => Promise<any>

    addFavIcon: (url: string, favIconURI: string) => Promise<any>

    addTag: (
        params: { url: string; tag: string; tabId?: number },
    ) => Promise<void>
    delTag: (
        params: { url: string; tag: string; tabId?: number },
    ) => Promise<void>
    fetchPageTags: (url: string) => Promise<any>

    grabExistingKeys: () => Promise<{
        histKeys: Set<string>
        bmKeys: Set<string>
    }>
}
