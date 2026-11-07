export type GlyphId = string | number;
export type Bytes = number[] | Uint8Array;
export type RawTable = Record<string, unknown> & {
	_raw?: number[];
	_checksum?: number;
};
export type Tables = Record<string, RawTable>;
export interface FontInfo {
	familyName?: string;
	styleName?: string;
	fullName?: string;
	postScriptName?: string;
	unitsPerEm?: number;
	ascender?: number;
	descender?: number;
	lineGap?: number;
	weightClass?: number;
	widthClass?: number;
	italicAngle?: number;
	isBold?: boolean;
	isItalic?: boolean;
	[key: string]: unknown;
}
export interface Point {
	x: number;
	y: number;
	onCurve: boolean;
}
export interface PathCommand {
	type: 'M' | 'L' | 'Q' | 'C' | 'Z';
	x?: number;
	y?: number;
	x1?: number;
	y1?: number;
	x2?: number;
	y2?: number;
}
export type Contours = Point[][] | PathCommand[][];
export interface Component {
	glyphName?: string;
	glyphIndex?: number;
	dx?: number;
	dy?: number;
	scale?: number;
	scaleXY?: { x: number; y: number };
	transform?: Record<string, number>;
	flags?: Record<string, boolean>;
	argument1?: number;
	argument2?: number;
	useMyMetrics?: boolean;
}
export interface Glyph {
	name: string;
	unicode?: number | null;
	unicodes?: number[];
	advanceWidth?: number;
	leftSideBearing?: number;
	advanceHeight?: number;
	topSideBearing?: number;
	contours?: Contours;
	components?: Component[];
	charString?: number[];
	instructions?: number[];
	path?: string;
	format?: 'truetype' | 'cff';
	[key: string]: unknown;
}
export interface KerningPair {
	left: GlyphId;
	right: GlyphId;
	value: number;
}
export interface KerningClasses {
	leftClasses?: Record<string, GlyphId[]>;
	rightClasses?: Record<string, GlyphId[]>;
	classes?: Record<string, GlyphId[]>;
	pairs: KerningPair[];
}
export type KerningInput =
	| KerningPair
	| { left: GlyphId; pairs: Record<string, number> }
	| { groups: Record<string, Record<string, number>> }
	| { classes: Record<string, GlyphId[]>; pairs: KerningPair[] };
export type SubstitutionType =
	| 'single'
	| 'multiple'
	| 'alternate'
	| 'ligature'
	| 'reverse'
	| 'contextual';
export interface SubstitutionRule {
	type: SubstitutionType;
	feature?: string;
	script?: string;
	language?: string | null;
	from?: GlyphId;
	to?: GlyphId | GlyphId[];
	alternates?: GlyphId[];
	components?: GlyphId[];
	ligature?: GlyphId;
	input?: GlyphId[][];
	backtrack?: GlyphId[][];
	lookahead?: GlyphId[][];
	actions?: {
		at: number;
		substitution?: SubstitutionRule;
		substitutions?: SubstitutionRule[];
	}[];
	lookup?: Record<string, unknown>;
}
export interface SubstitutionInput extends Omit<
	SubstitutionRule,
	'from' | 'to'
> {
	classes?: Record<string, GlyphId[]>;
	substitution?: Omit<SubstitutionRule, 'type'>;
	substitutions?: Omit<SubstitutionRule, 'type'>[];
}
export interface SubstitutionFilter {
	type?: SubstitutionType;
	feature?: string;
	from?: GlyphId;
	ligature?: GlyphId;
}
export interface Axis {
	tag: string;
	name?: string;
	min: number;
	default: number;
	max: number;
	hidden?: boolean;
}
export interface NamedInstance {
	name: string;
	coordinates: Record<string, number>;
	postScriptName?: string;
}
export interface ColorGlyph {
	name: string;
	layers?: { glyph: string; paletteIndex: number }[];
	paint?: Record<string, unknown>;
}
export interface Hinting {
	gasp?: { maxPPEM: number; behavior: number }[];
	cvt?: number[];
	fpgm?: number[];
	prep?: number[];
}
export interface FontData extends Hinting {
	font: FontInfo;
	glyphs: Glyph[];
	kerning?: KerningPair[];
	kerningClasses?: KerningClasses[];
	substitutions?: SubstitutionRule[];
	axes?: Axis[];
	instances?: NamedInstance[];
	palettes?: string[][];
	colorGlyphs?: ColorGlyph[];
	features?: Tables;
	tables?: Tables;
	_header?: Record<string, unknown>;
	_woff?: Record<string, unknown>;
	[key: string]: unknown;
}
export interface RawFontData {
	header: Record<string, unknown>;
	tables: Tables;
}
export interface CollectionData {
	collection: Record<string, unknown>;
	fonts: (FontData | RawFontData)[];
}
export type FontDocument = FontData | RawFontData | CollectionData;
export interface ImportOptions {
	maxUncompressedBytes?: number;
	maxInputBytes?: number;
	maxTableBytes?: number;
	maxTables?: number;
	maxFonts?: number;
	maxGlyphs?: number;
	maxPoints?: number;
	maxCharStringOperations?: number;
	maxStructureDepth?: number;
	maxStructureNodes?: number;
	faceIndex?: number;
}
export interface ExportOptions {
	format?: 'sfnt' | 'woff' | 'woff2' | 'cff' | 'ttf' | 'otf';
	[key: string]: unknown;
}
export interface ValidationIssue {
	severity: 'error' | 'warning' | 'info';
	code: string;
	message: string;
	path?: string;
	faceIndex?: number;
	id?: string;
	checkId?: string;
	executionId?: string;
	outcome?: 'failed' | 'informational';
	source?: string;
	location?: FindingLocation;
	evidence?: { message: string };
	[key: string]: unknown;
}
export interface ValidationReport {
	valid: boolean;
	errors: ValidationIssue[];
	warnings: ValidationIssue[];
	infos: ValidationIssue[];
	issues: ValidationIssue[];
	schemaVersion?: 1;
	source?: string;
	complete?: boolean;
	checks?: CheckExecution[];
	summary: {
		errorCount: number;
		warningCount: number;
		infoCount: number;
		issueCount: number;
	};
}
export interface FindingLocation {
	table?: string;
	faceIndex?: number;
	glyphIndex?: number;
	fontIndex?: number;
	lookupIndex?: number;
	subtableIndex?: number;
	segmentIndex?: number;
	directoryIndex?: number;
	byteOffset?: number;
	path?: string;
}
export interface CheckExecution {
	id: string;
	revision: number;
	source: string;
	location: FindingLocation;
	outcome: 'passed' | 'failed' | 'skipped' | 'blocked' | 'unsupported';
	coverage: 'complete' | 'partial' | 'not-checked';
	reasonCode: string;
	reason: string;
	findingIds: string[];
	provenance?: string;
	rationale?: string;
	consequence?: string;
}
export interface DiagnosticMetadata {
	format?: string;
	sfVersion?: number;
	tableTags?: string[];
	directoryComplete?: boolean;
	names?: { nameID: number; platformID: number; encodingID: number; languageID: number; value: string }[];
}
export interface DiagnosticFaceReport extends ValidationReport {
	faceIndex: number;
	schemaVersion: 1;
	source: string;
	complete: boolean;
	checks: CheckExecution[];
	metadata: DiagnosticMetadata;
}
export interface DiagnosticReport extends ValidationReport {
	schemaVersion: 1;
	source: string;
	complete: boolean;
	checks: CheckExecution[];
	metadata: DiagnosticMetadata;
	faces: DiagnosticFaceReport[];
}
export type QualityProfileId = 'structural' | 'interoperability' | 'publishing';
export interface InspectionOptions extends ImportOptions {
	profile?: QualityProfileId;
	profileVersion?: 1;
	context?: { fileName?: string; expectedFileName?: string; expectedFamilyName?: string };
}
export interface QualityProfile {
	readonly id: QualityProfileId;
	readonly version: 1;
	readonly description: string;
}
export interface ProfileReport extends ValidationReport {
	id: QualityProfileId;
	version: 1;
	complete: boolean;
	passed: boolean;
	checks: CheckExecution[];
}
export interface LegacyProfileReport extends Omit<ProfileReport, 'valid'> {
	valid: null;
	passed: false;
	complete: false;
}
export type CheckPipeline = 'binary' | 'editable' | 'resolved' | 'public-validation' | 'profile';
export interface CheckSource {
	readonly file: string;
	readonly line: number;
	readonly symbol: string;
}
export interface CheckOrigin {
	readonly checkId: string;
	readonly pipeline: CheckPipeline;
	readonly family: string;
	readonly table?: string;
	readonly tables: readonly string[];
	readonly formats: readonly string[];
	readonly kind: 'finding' | 'information';
	readonly publicReachability: string;
	readonly source: CheckSource;
	readonly references: readonly string[];
	readonly severities: readonly ('error' | 'warning' | 'info')[];
	readonly expression?: string;
	readonly expansionEvidence?: readonly (CheckSource & { readonly expression: string })[];
	readonly profiles?: readonly string[];
}
export interface CheckDescriptor extends CheckOrigin {
	readonly id: string;
	readonly pipelines: readonly CheckPipeline[];
	readonly checkIds: readonly string[];
	readonly repairIds: readonly string[];
	readonly noFixReason?: string;
	readonly status: 'active' | 'legacy';
	readonly baseline: boolean;
	readonly retirementReason?: string;
	readonly sourceRevision?: string;
	readonly origins: readonly CheckOrigin[];
}
export interface RepairInput {
	readonly key: string;
	readonly label: string;
	readonly type: 'string' | 'integer' | 'number' | 'boolean' | 'enum';
	readonly min?: number;
	readonly max?: number;
	readonly maxLength?: number;
	readonly values?: readonly string[];
	readonly mustBeTrue?: boolean;
}
export interface RepairDescriptor {
	readonly id: string;
	readonly revision: number;
	readonly title: string;
	readonly risk: 'safe' | 'assisted' | 'potentially-lossy';
	readonly formats: readonly string[];
	readonly codes: readonly string[];
	readonly description: string;
	readonly prerequisites: string;
	readonly riskReason: string;
	readonly invariants: readonly string[];
	readonly affectedTables?: readonly string[];
	readonly conflicts?: readonly string[];
	readonly companions?: readonly string[];
	readonly after?: readonly string[];
	readonly optional?: boolean;
	readonly policyVersion?: string;
	readonly ifApplied: string;
	readonly ifUnfixed: string;
	readonly inputs: readonly RepairInput[];
}
export interface RepairOffer extends RepairDescriptor {
	readonly availability: 'available' | 'needs-input' | 'blocked' | 'unsupported';
	readonly reason: string;
}
export interface InspectionReport {
	schemaVersion: 1;
	scope: 'binary';
	format: 'sfnt' | 'collection' | 'woff' | 'woff2' | 'cff' | 'type1' | 'unknown';
	profile: QualityProfileId;
	profileVersion: 1;
	profileReport: ProfileReport | LegacyProfileReport;
	complete: false;
	checks: CheckExecution[];
	diagnostics: DiagnosticReport | null;
	coverage: WorkflowCoverage[];
	repairs: RepairOffer[];
	limitations: string[];
	legacyFormat?: LegacyInspectionReport['format'];
	issues?: ValidationIssue[];
	cache?: InspectionCacheEvidence;
}
export interface RepairRequest {
	id: string;
	inputs?: Record<string, string | number | boolean>;
	consent?: boolean;
}
export interface RepairPlan {
	readonly schemaVersion: 1;
	readonly inputFingerprint: string;
	readonly profile: QualityProfileId;
	readonly profileVersion: 1;
	readonly format: InspectionReport['format'];
	readonly registryRevision: 2;
	readonly faceIndex: number | null;
	readonly projectRevision: string | number | null;
	readonly requests: readonly RepairRequest[];
	readonly options: Readonly<Omit<RepairOptions, 'signal' | 'onProgress'>>;
	readonly effects: readonly string[];
	readonly steps: readonly (RepairOffer & {
		readonly implicit: boolean;
		readonly values: Readonly<Record<string, string | number | boolean>>;
	})[];
}
export interface RepairResult {
	state: 'verified' | 'failed';
	buffer: ArrayBuffer | null;
	changed: boolean;
	format: InspectionReport['format'];
	faceIndex: number | null;
	profile: QualityProfileId;
	plan: RepairPlan;
	before: InspectionReport;
	after: InspectionReport;
	changes: { id: string; description: string }[];
	verification: { passed: boolean; failures: string[]; evidence: string[] };
	inputFingerprint: string;
	outputFingerprint: string | null;
}
export interface QualityControls {
	signal?: AbortSignal;
	onProgress?: (progress: { phase: string; stage?: string; status?: string; sequence?: number; origin?: string }) => void;
}
export interface RepairOptions extends InspectionOptions, QualityControls {
	format?: 'sfnt' | 'woff' | 'woff2' | 'collection';
	projectRevision?: string | number;
}
export interface PreflightResult {
	schemaVersion: 1;
	state: 'verified' | 'failed' | 'unsupported';
	buffer: ArrayBuffer | null;
	validation: ValidationReport;
	output: InspectionReport | null;
	effects: string[];
	error: string | null;
	stages: PreflightStage[];
	normalizations: {
		kind: 'validation-copy-only' | 'finding-not-observed-in-output';
		code: string;
		path?: string;
		originalFindingId?: string;
		executionId?: string;
		description: string;
	}[];
}
export interface PreflightOptions extends ExportOptions, InspectionOptions {
	/** Explicit caller-declared baseline for authored data; an imported font's retained original takes priority. */
	originalSource?: { bytes: ArrayBuffer | Uint8Array; options?: ImportOptions };
}
export interface WorkerControls extends QualityControls {
	maxDurationMs?: number;
	maxPlanBytes?: number;
	maxProjectBytes?: number;
	workerResourceLimits?: {
		maxOldGenerationSizeMb?: number;
		maxYoungGenerationSizeMb?: number;
		codeRangeSizeMb?: number;
		stackSizeMb?: number;
	};
}
export interface InspectionCache {
	clear(): void;
	readonly stats: Readonly<{
		entries: number; payloadBytes: number; maxEntries: number; maxBytes: number; ttlMs: number;
		hits: number; misses: number; writes: number; evictions: number;
	}>;
}
export interface InspectionCacheEvidence {
	status: string;
	inputFingerprint: string;
	optionsFingerprint: string;
	entryURL: string;
	workerStarted: boolean;
	[key: string]: unknown;
}
export interface RepairReview {
	readonly schemaVersion: 1;
	readonly kind: 'repair-review';
	readonly plan: RepairPlan;
	readonly planFingerprint: string;
	readonly inputFingerprint: string;
	readonly entryURL: string;
}
export interface WorkflowCoverage {
	domain: string;
	status: string;
	reason: string;
}
export interface WorkflowReport {
	schemaVersion: 1;
	scope: string;
	source: string;
	complete: false;
	issues: ValidationIssue[];
	checks: CheckExecution[];
	coverage: WorkflowCoverage[];
	limitations: string[];
	summary: ValidationReport['summary'] & { errors: number; warnings: number };
	[key: string]: unknown;
}
export type QualityInput = FontFlux | FontData | ArrayBuffer | Uint8Array;
export interface QualityMember {
	id: string;
	input: QualityInput;
	faceIndex?: number;
}
export interface FamilyQualityOptions extends InspectionOptions, QualityControls {
	family: {
		id: string;
		profile: string;
		expectedMembers?: string[];
		policy?: {
			requiredFields?: string[];
			allowDifferences?: string[];
			members?: Record<string, Record<string, string | number | boolean>>;
		};
	};
	maxMembers?: number;
	maxTotalInputBytes?: number;
}
export interface FamilyRepairResult {
	schemaVersion: 1;
	scope: 'family-repair';
	state: 'verified' | 'failed' | 'cancelled';
	committed: false;
	candidates: { id: string; result: RepairResult }[];
	failures?: { memberId?: string; message: string; name: string }[];
	[key: string]: unknown;
}
export interface ExpectationOptions extends InspectionOptions {
	repertoires?: { id: string; version: string; language?: string; source?: string; codePoints: number[] }[];
	requiredGlyphs?: string[];
	behavior?: { codePoint: number; advanceWidth?: number; empty?: boolean }[];
	roots?: (string | number)[];
	glyphNames?: { id: string; version: string; maxLength?: number; asciiOnly?: boolean };
	maxWork?: number;
}
export interface SourceQualityOptions extends InspectionOptions {
	tinyArea?: number;
	samples?: { id?: string; weights: number[] }[];
	engineEvidence?: { engine: string; version: string; outcome: 'pass' | 'fail' | 'unknown'; [key: string]: unknown }[];
	maxMasters?: number;
	maxWork?: number;
}
export interface LegacyInspectionOptions extends InspectionOptions {
	maxWork?: number;
	maxTotalCharStringOperations?: number;
}
export interface LegacyInspectionReport extends WorkflowReport {
	scope: 'legacy';
	format: 'cff' | 'pfa' | 'pfb' | 'afm' | 'unknown';
	original: { format: string; byteLength: number; synthesizedTables: false; mutated: false };
	capabilities: {
		import: boolean; inspect: 'partial' | 'unsupported'; preserveOriginalBytes: true;
		repairOriginalFormat: false; exportOriginalFormat: boolean;
	};
	repairs: [];
	profile: QualityProfileId;
	profileVersion: 1;
	profileReport: LegacyProfileReport;
	diagnostics: Omit<DiagnosticReport, 'valid'> & { valid: boolean | null };
}
export type LegacyRecoveryResult = {
	schemaVersion: 1;
	operation: 'source-replacement';
	preservedOriginal: true;
	original: LegacyInspectionReport;
	replacement: InspectionReport;
} & (
	{ state: 'failed'; buffer: null } |
	{ state: 'inspected'; buffer: ArrayBuffer; equivalent: null; limitations: string[] }
);
export type PreflightStage = {
	status: 'checked' | 'skipped' | 'blocked' | 'failed' | 'unsupported';
	reasonCode: string;
	reason?: string;
} & (
	{ id: 'original' | 'output'; report: InspectionReport | null } |
	{ id: 'project' | 'resolved'; report: ValidationReport | null }
);
export class FontFlux {
	constructor(data: FontData);
	static create(options?: {
		family?: string;
		style?: string;
		unitsPerEm?: number;
		ascender?: number;
		descender?: number;
	}): FontFlux;
	static open(
		input: ArrayBuffer | Uint8Array | string,
		options?: ImportOptions,
	): FontFlux;
	static openAll(
		input: ArrayBuffer | Uint8Array | string,
		options?: Omit<ImportOptions, 'faceIndex'>,
	): FontFlux[];
	static fromJSON(jsonString: string): FontFlux;
	static initWoff2(): Promise<void>;
	static exportCollection(
		fonts: FontFlux[],
		options?: ExportOptions,
	): ArrayBuffer;
	static diagnose(buffer: ArrayBuffer, options?: ImportOptions): DiagnosticReport;
	static inspect(input: ArrayBuffer | Uint8Array, options?: InspectionOptions): InspectionReport;
	static inspectAsync(input: ArrayBuffer | Uint8Array, options?: InspectionOptions & WorkerControls & { cache?: InspectionCache }): Promise<InspectionReport>;
	static createInspectionCache(options?: { maxEntries?: number; maxBytes?: number; ttlMs?: number }): InspectionCache;
	static fingerprintRepairPlan(plan: RepairPlan, options?: { maxPlanBytes?: number }): Promise<string>;
	static planRepairsAsync(input: ArrayBuffer | Uint8Array, requests: RepairRequest[], options?: RepairOptions & WorkerControls): Promise<RepairReview>;
	static repairAsync(input: ArrayBuffer | Uint8Array, requests: RepairRequest[], options?: RepairOptions & WorkerControls): Promise<RepairResult>;
	static applyRepairsAsync(input: ArrayBuffer | Uint8Array, review: RepairReview | RepairPlan,
		options?: RepairOptions & WorkerControls & { reviewedPlanFingerprint?: string }): Promise<RepairResult>;
	static inspectFamily(inputs: QualityMember[], options: FamilyQualityOptions): WorkflowReport;
	static repairFamily(inputs: QualityMember[], requests: Record<string, RepairRequest[]>, options: FamilyQualityOptions): Promise<FamilyRepairResult>;
	static inspectExpectations(input: QualityInput, options?: ExpectationOptions): WorkflowReport;
	static inspectSourceQuality(projects: (QualityMember & { source?: Record<string, unknown> })[], options?: SourceQualityOptions): WorkflowReport;
	static inspectLegacy(input: ArrayBuffer | Uint8Array, options?: LegacyInspectionOptions): LegacyInspectionReport;
	static recoverLegacy(input: ArrayBuffer | Uint8Array, replacement: ArrayBuffer | Uint8Array,
		options: LegacyInspectionOptions & { authorizeReplacement: true }): LegacyRecoveryResult;
	static checkCatalog(): Readonly<Record<string, CheckDescriptor>>;
	static qualityProfiles(): readonly QualityProfile[];
	static repairCatalog(): readonly RepairDescriptor[];
	static planRepairs(input: ArrayBuffer | Uint8Array, requests: RepairRequest[], options?: RepairOptions): Promise<RepairPlan>;
	static resumeRepairPlan(input: ArrayBuffer | Uint8Array, serialized: RepairPlan, options?: RepairOptions): Promise<RepairPlan>;
	static applyRepairs(input: ArrayBuffer | Uint8Array, plan: RepairPlan, options?: RepairOptions): Promise<RepairResult>;
	static svgToContours(path: string, format?: 'truetype' | 'cff'): Contours;
	static contoursToSVG(contours: Contours): string;
	static compileCharString(contours: Contours): number[];
	static assembleCharString(text: string): number[];
	static interpretCharString(
		bytes: Bytes,
		globalSubrs?: Bytes[],
		localSubrs?: Bytes[],
	): { contours: Contours; width: number | null; [key: string]: unknown };
	static disassembleCharString(bytes: Bytes): string;
	readonly data: FontData;
	readonly info: FontInfo;
	readonly glyphs: Glyph[];
	readonly kerning: KerningPair[];
	readonly axes: Axis[] | undefined;
	readonly instances: NamedInstance[] | undefined;
	readonly substitutions: SubstitutionRule[];
	readonly palettes: string[][];
	readonly colorGlyphs: ColorGlyph[];
	readonly features: Tables | undefined;
	readonly tables: Tables | undefined;
	readonly glyphCount: number;
	readonly format: 'truetype' | 'cff' | 'cff2';
	getInfo(): FontInfo;
	setInfo(partial: FontInfo): void;
	listGlyphs(): { name: string; unicode: number | null; index: number }[];
	getGlyph(id: GlyphId): Glyph | undefined;
	hasGlyph(id: GlyphId): boolean;
	getGlyphContours(id: GlyphId): Contours;
	addGlyph(glyphOrOptions: Glyph): void;
	removeGlyph(id: GlyphId): boolean;
	getKerning(left: GlyphId, right: GlyphId): number | undefined;
	addKerning(input: KerningInput | KerningInput[]): void;
	removeKerning(left: GlyphId, right: GlyphId): boolean;
	listKerning(): KerningPair[];
	clearKerning(): void;
	listSubstitutions(filter?: SubstitutionFilter): SubstitutionRule[];
	getSubstitution(
		id: GlyphId,
		options?: SubstitutionFilter,
	): SubstitutionRule[];
	addSubstitution(input: SubstitutionInput | SubstitutionInput[]): void;
	removeSubstitution(filter: SubstitutionFilter): number;
	clearSubstitutions(): void;
	listAxes(): Axis[];
	getAxis(tag: string): Axis | undefined;
	addAxis(axis: Axis): void;
	removeAxis(tag: string): boolean;
	setAxis(tag: string, partial: Partial<Axis>): boolean;
	listInstances(): NamedInstance[];
	addInstance(instance: NamedInstance): void;
	removeInstance(name: string): boolean;
	getPalette(index: number): string[] | undefined;
	addPalette(
		colors: (
			| string
			| { blue: number; green: number; red: number; alpha: number }
		)[],
	): number;
	removePalette(index: number): boolean;
	setPaletteColor(paletteIndex: number, colorIndex: number, hex: string): void;
	getColorGlyph(id: GlyphId): ColorGlyph | undefined;
	addColorGlyph(input: ColorGlyph): void;
	removeColorGlyph(id: GlyphId): boolean;
	listColorGlyphs(): { name: string; type: string }[];
	getFeatures(): Tables;
	setFeatures(partial: Tables): void;
	getHinting(): Hinting;
	setHinting(partial: Hinting): void;
	export(options?: ExportOptions): ArrayBuffer;
	convertOutlines(target: 'truetype' | 'cff'): this;
	toJSON(indent?: number): string;
	validate(): ValidationReport;
	preflight(options?: PreflightOptions): Promise<PreflightResult>;
	preflightAsync(options?: PreflightOptions & WorkerControls): Promise<PreflightResult>;
	detach(): this;
}
export function initWoff2(): Promise<void>;
export function diagnoseFont(buffer: ArrayBuffer, options?: ImportOptions): DiagnosticReport;
export function fontToJSON(data: FontDocument, indent?: number): string;
export function fontFromJSON(json: string): FontDocument;
