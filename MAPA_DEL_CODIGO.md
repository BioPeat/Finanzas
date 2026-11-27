# MAPA DEL CÓDIGO · Finanzas v12

Generado automáticamente a partir de los módulos `js/*.js`.


## js/state.js
### Estado, almacenamiento local, sincronización cifrada y utilidades · línea 1
- `localDate(d)` · js/state.js:13
- `addDays(s, n)` · js/state.js:14
- `monthAdd(m, n)` · js/state.js:16
- `fmtDate(s, o = { day: 'numeric', month: 'short' })` · js/state.js:20
- `nf(n, d = 2, min = d)` · js/state.js:21
- `money(eur, opts = {})` · js/state.js:22
- `moneyBig(eur)` · js/state.js:31
- `toNum(v)` · js/state.js:38
- `toDate(v, dmy = true)` · js/state.js:48
- `download(name, text, type = 'application/json')` · js/state.js:61
- `copyText(t, msg = 'Copiado')` · js/state.js:65
- `defaults()` · js/state.js:117
- `load()` · js/state.js:139
- `migrate(o)` · js/state.js:144
- `autoBackup()` · js/state.js:155
- `backupInfo()` · js/state.js:163
- `restoreAutomaticBackup()` · js/state.js:164
- `save(sync = true)` · js/state.js:174
- `stampChanges(before)` · js/state.js:179
- `change(fn, msg)` · js/state.js:195
- `undo()` · js/state.js:202
- `toast(text, canUndo = false)` · js/state.js:211
### Sincronización cifrada entre dispositivos · línea 216
- `b64u(b)` · js/state.js:217
- `syncKey()` · js/state.js:219
- `syncId()` · js/state.js:220
- `syncPayload()` · js/state.js:221
- `encrypt(obj)` · js/state.js:222
- `decrypt(s)` · js/state.js:228
- `mergeStates(local, remote)` · js/state.js:233
- `scheduleSync(ms = 1500)` · js/state.js:262
- `syncNow(manual = false)` · js/state.js:263
- `ago(t)` · js/state.js:318
- `paintSync()` · js/state.js:319
- `pairLink()` · js/state.js:332
- `readPair()` · js/state.js:338
- `instKey(a)` · js/state.js:369
- `assetColor(sym)` · js/state.js:378
- `catInitials(c)` · js/state.js:384
- `initials(s)` · js/state.js:388

## js/finance.js
### Categorías, finanzas, cartera, derivados, análisis y fiscalidad España · línea 1
- `merchantOf(desc)` · js/finance.js:38
- `fmtMerchant(s)` · js/finance.js:46
- `fmtFreq(days)` · js/finance.js:49
- `categorize(t)` · js/finance.js:59
### Activos, divisas y normalización · línea 70
- `normAsset(a)` · js/finance.js:78
- `baseSym(instr)` · js/finance.js:83
- `ensureAsset(sym)` · js/finance.js:90
- `fx(cur)` · js/finance.js:92
- `priceEUR(sym)` · js/finance.js:93
- `trackedAssets()` · js/finance.js:99
### Cartera, saldos y derivados en tiempo real · línea 108
- `bankBalance(a)` · js/finance.js:109
- `positionRows()` · js/finance.js:123
- `accValue(a, rows)` · js/finance.js:135
- `derivRows()` · js/finance.js:137
- `derivSummary()` · js/finance.js:177
- `netWorth()` · js/finance.js:189
- `investmentSummary()` · js/finance.js:196
- `snapshot()` · js/finance.js:209
- `bankHistory(days = 365)` · js/finance.js:215
- `reliableHistory(points)` · js/finance.js:226
- `netSeries(days)` · js/finance.js:237
- `changeWindow(days)` · js/finance.js:250
- `invSeries(days)` · js/finance.js:270
### Flujo mensual, previsiones y alertas · línea 293
- `monthTotals(m = monthKey(today()` · js/finance.js:294
- `lastMonths(n)` · js/finance.js:301
- `recurring()` · js/finance.js:303
- `liquidity()` · js/finance.js:315
- `avgMonthlyExpense()` · js/finance.js:316
- `cushion()` · js/finance.js:321
- `pace()` · js/finance.js:322
- `upcoming(days = 31)` · js/finance.js:327
- `forecast()` · js/finance.js:340
- `safeToSpend()` · js/finance.js:352
- `topMerchants(m, n = 5)` · js/finance.js:359
- `dailySpend(m)` · js/finance.js:360
- `goalSaved(g)` · js/finance.js:361
- `alerts()` · js/finance.js:363
### Fiscalidad España (FIFO, base del ahorro, Modelo 721) · línea 390
- `cuotaAhorro(base)` · js/finance.js:392
- `matchTransfers(L)` · js/finance.js:393
- `taxGroups()` · js/finance.js:402
- `taxPrefetch(onStep)` · js/finance.js:407
- `taxCompute()` · js/finance.js:418
- `costBasis()` · js/finance.js:463
- `balancesAt(date)` · js/finance.js:464
- `modelo721(year)` · js/finance.js:465
- `taxSummary(year, extra = 0)` · js/finance.js:471
- `byCoin(disp)` · js/finance.js:476
- `taxCSV(year)` · js/finance.js:477
- `taxAIText(year)` · js/finance.js:486

## js/charts.js
### Estado de interfaz y gráficos interactivos SVG (propios, sin librerías) · línea 1
- `rangeBtns()` · js/charts.js:14
- `fmtChartMoney(eur, d = 0, sign = false)` · js/charts.js:16
- `svgLine(pts, { h, w, id = 'nw', col, axis = true } = )` · js/charts.js:25
- `svgCandles(candles, { h, w, id = 'ohlcv', sym = 'BTC', s)` · js/charts.js:48
- `svgCompare(m)` · js/charts.js:116
- `svgDays(m)` · js/charts.js:139
- `svgMonths(months)` · js/charts.js:155
- `spendCalendarHTML(m)` · js/charts.js:162
- `donut(entries, { id = 'cats', label = 'Gastado', to)` · js/charts.js:177
- `allocBar(parts)` · js/charts.js:184
- `bindCharts(root = document)` · js/charts.js:189

## js/importers.js
### Importadores universales (XLSX, CSV, OFX, QIF, JSON y extracción IA) · línea 1
- `unzip(buf)` · js/importers.js:4
- `readXlsx(buf)` · js/importers.js:19
- `parseCSV(text)` · js/importers.js:38
- `findHeader(rows, needles)` · js/importers.js:54
- `detect(rows)` · js/importers.js:66
- `col(hs, ...names)` · js/importers.js:70
- `parseBank(rows, fmt, head)` · js/importers.js:72
- `binanceKind(op, acct)` · js/importers.js:97
- `krakenKind(type, sub)` · js/importers.js:109
- `parseLedger(rows, fmt, head, map)` · js/importers.js:118
- `parseOFX(text)` · js/importers.js:154
- `parseQIF(text)` · js/importers.js:165
- `readFile(file)` · js/importers.js:176
- `importFiles(files)` · js/importers.js:192
- `openImport(rows, det, fname, map)` · js/importers.js:206
- `openMapper(rows, fname, rawText = '')` · js/importers.js:243
- `openPositionsImport(rows, head, fname, map)` · js/importers.js:271
- `importBackup(o)` · js/importers.js:295
- `openAIImportModal(opts = {})` · js/importers.js:301

## js/live.js
### Datos en directo (WebSocket, precios, velas OHLCV, técnico, radar y TradingView) · línea 1
- `startLiveStream()` · js/live.js:6
- `stopLiveStream()` · js/live.js:45
- `patchLiveDOM(sym, eur, chg, prevEur)` · js/live.js:50
- `checkPriceAlertsLive(sym, eur)` · js/live.js:72
- `refreshPrices(force = false)` · js/live.js:83
- `directPrices(cryptos)` · js/live.js:101
- `priceAt(sym, t)` · js/live.js:108
- `loadOHLCV(sym, interval = chartInterval, force = false)` · js/live.js:125
- `calcTechnical(closes)` · js/live.js:146
- `loadAssetIntel(sym)` · js/live.js:157
- `loadRadar()` · js/live.js:171
- `searchTickers(q)` · js/live.js:188
- `tvSymbol(sym)` · js/live.js:203
- `tradingViewURL(sym)` · js/live.js:210
- `exchangeTradeURL(ex, sym)` · js/live.js:214

## js/connectors.js
### Conectores automáticos: Exchanges, Open Banking (Enable Banking), Wallets On-Chain y Worker · línea 1
- `resetWorkerRoute()` · js/connectors.js:6
- `workerEndpoints()` · js/connectors.js:7
- `rememberWorkerMirrors(info)` · js/connectors.js:13
- `api(path, opts = {})` · js/connectors.js:24
- `syncBalances(manual = false)` · js/connectors.js:62
- `syncExchangeHistory(ex)` · js/connectors.js:95
- `syncOnChainWallets(manual = false)` · js/connectors.js:116
### Open Banking PSD2 gratuito (Enable Banking) · línea 139
- `isFileImportSrc(src)` · js/connectors.js:140
- `hasUploadedBankExcel(accId)` · js/connectors.js:144
- `purgeBankExcelForAccount(acc, opts = { removeSiblingExcelAccounts: tru)` · js/connectors.js:147
- `purgeBankExcelByAccId(accId)` · js/connectors.js:175
- `reconcileEnableBankingAccounts()` · js/connectors.js:186
- `openBankConnectModal(initialFilter = '')` · js/connectors.js:219
- `startBankAuth(aspspName, country, maxValidSec = 0)` · js/connectors.js:259
- `quickAuthorizeSantander()` · js/connectors.js:273
- `handleBankCallback()` · js/connectors.js:289
- `syncConnectedBanks(manual = false, opts = {})` · js/connectors.js:346
- `saveVaultCredentials(group, opts = {})` · js/connectors.js:493
- `openConnectHub(initialTab = 'bancos')` · js/connectors.js:556

## js/ai.js
### Copiloto de IA: Chat conversacional (Gemini / Local), análisis, categorización y extracción · línea 1
- `renderMarkdown(md)` · js/ai.js:4
- `portfolioMetricsFromPayload(rows)` · js/ai.js:36
- `aiPayload(kind)` · js/ai.js:41
- `aiContext()` · js/ai.js:59
- `localAdvice(kind)` · js/ai.js:61
- `localChatReply(q)` · js/ai.js:93
- `getActiveChat()` · js/ai.js:147
- `sendChatMessage(text)` · js/ai.js:158
- `runAI(kind)` · js/ai.js:187
- `parseJSONSafe(text)` · js/ai.js:205
- `aiCategorizeUnknowns()` · js/ai.js:211
- `aiParseImport(payload)` · js/ai.js:242

## js/views-desktop.js
### Vistas de Escritorio (Editorial Ledger) y componentes compartidos · línea 1
- `head(title, sub, actions = '')` · js/views-desktop.js:5
- `compactEmpty(title, text, action = '')` · js/views-desktop.js:8
- `changeCell(days, label)` · js/views-desktop.js:11
- `changeGridHTML(tag = 'div', attrs = '')` · js/views-desktop.js:15
- `accountLine(a, rows)` · js/views-desktop.js:40
- `homeAssets(rows)` · js/views-desktop.js:44
- `txItem(t)` · js/views-desktop.js:52
- `catRow(k, v, max, total, attrs)` · js/views-desktop.js:62
- `goalRow(g)` · js/views-desktop.js:70
- `holdingRow(x)` · js/views-desktop.js:75
- `accCard(a, rows)` · js/views-desktop.js:82
- `derivCardHTML(d)` · js/views-desktop.js:100
- `opsTable(ops, hideAcc = false)` · js/views-desktop.js:119
- `invDonut(list)` · js/views-desktop.js:124
- `workerInfoHTML(i)` · js/views-desktop.js:129
- `onboarding()` · js/views-desktop.js:137
- `renderDesktopTopbar()` · js/views-desktop.js:146
- `renderAIDrawer()` · js/views-desktop.js:148
### 1. Inicio Escritorio (Editorial Ledger) · línea 158
- `vResumenDesktop()` · js/views-desktop.js:159
### 2. Terminal de Mercados, Velas en directo y Derivados (Escritorio) · línea 262
- `buildPortfolioContext()` · js/views-desktop.js:263
- `portfolioMetrics(list, total)` · js/views-desktop.js:274
- `watchlistSymbols(list)` · js/views-desktop.js:280
- `marketChartDeck(sym)` · js/views-desktop.js:284
- `vInvDesktop()` · js/views-desktop.js:305
### 3. Movimientos (Escritorio) · línea 377
- `filtered()` · js/views-desktop.js:378
- `vMovsDesktop()` · js/views-desktop.js:383
### 4. Cuentas y Detalle de Cuenta · línea 429
- `vAccountDetail(accId)` · js/views-desktop.js:430
- `vCuentasDesktop()` · js/views-desktop.js:473
### 5. Plan, Presupuestos y Alertas de precio · línea 490
- `vGoalsDesktop()` · js/views-desktop.js:491
### 6. Impuestos España · línea 508
- `vTax()` · js/views-desktop.js:509
### 7. Copiloto Studio (Escritorio) · línea 534
- `vCopilotDesktop()` · js/views-desktop.js:535
### 8. Ajustes · línea 556
- `vAjustes()` · js/views-desktop.js:558
- `vMasDesktop()` · js/views-desktop.js:585

## js/views-mobile.js
### Vistas Móviles (Editorial Táctil) · línea 1
- `vResumenMobile()` · js/views-mobile.js:4
- `vInvMobile()` · js/views-mobile.js:73
- `vMovsMobile()` · js/views-mobile.js:121
- `vCuentasMobile()` · js/views-mobile.js:160
- `vCopilotMobile()` · js/views-mobile.js:172

## js/app.js
### Navegación, ventanas modales, acciones, gestos y arranque · línea 1
- `go(v, f)` · js/app.js:31
- `navBtn(id, n, i, clsName = 'nav')` · js/app.js:50
- `sideNav()` · js/app.js:54
- `sideAccountsHTML()` · js/app.js:66
- `drawerNav()` · js/app.js:81
- `renderNav()` · js/app.js:83
- `render()` · js/app.js:110
### PWA · línea 124
- `installState()` · js/app.js:129
- `installApp()` · js/app.js:130
- `repairPWA()` · js/app.js:135
### Modales de edición, derivados, wallets, watchlist, detalle y búsqueda · línea 141
- `modal(title, html)` · js/app.js:142
- `editTx(id)` · js/app.js:150
- `quickAdd()` · js/app.js:162
- `editOp(id)` · js/app.js:184
- `editDeriv(id)` · js/app.js:197
- `closeDerivModal(id)` · js/app.js:209
- `editAcc(id)` · js/app.js:215
- `editWalletModal()` · js/app.js:226
- `editGoal(id)` · js/app.js:234
- `editPriceAlertModal(defaultSym = selectedSymbol || 'BTC')` · js/app.js:244
- `openAddWatchModal()` · js/app.js:253
- `assetIntelHTML(sym)` · js/app.js:275
- `assetDetail(sym)` · js/app.js:284
- `openCommandPalette()` · js/app.js:297
### Drawer móvil, Drawer IA y Gestos · línea 338
- `toggleAIDrawer(force)` · js/app.js:339
- `resetDrawerGesture()` · js/app.js:346
- `openDrawer()` · js/app.js:347
- `closeDrawer()` · js/app.js:348
- `gestureStart(e)` · js/app.js:351
- `gestureMove(e)` · js/app.js:363
- `gestureEnd(e)` · js/app.js:384
### Acciones centralizadas · línea 397
- `confirmTwice(el)` · js/app.js:398
- `act(a, el)` · js/app.js:400
- `afterRender()` · js/app.js:674
- `refreshAll(force)` · js/app.js:701
- `init()` · js/app.js:712
