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
- `autoBackup()` · js/state.js:154
- `backupInfo()` · js/state.js:162
- `restoreAutomaticBackup()` · js/state.js:163
- `save(sync = true)` · js/state.js:173
- `stampChanges(before)` · js/state.js:178
- `change(fn, msg)` · js/state.js:194
- `undo()` · js/state.js:201
- `toast(text, canUndo = false)` · js/state.js:210
### Sincronización cifrada entre dispositivos · línea 215
- `b64u(b)` · js/state.js:216
- `syncKey()` · js/state.js:218
- `syncId()` · js/state.js:219
- `syncPayload()` · js/state.js:220
- `encrypt(obj)` · js/state.js:221
- `decrypt(s)` · js/state.js:227
- `mergeStates(local, remote)` · js/state.js:232
- `scheduleSync(ms = 1500)` · js/state.js:261
- `syncNow(manual = false)` · js/state.js:262
- `ago(t)` · js/state.js:298
- `paintSync()` · js/state.js:299
- `pairLink()` · js/state.js:312
- `readPair()` · js/state.js:313
- `instKey(a)` · js/state.js:326
- `assetColor(sym)` · js/state.js:335
- `catInitials(c)` · js/state.js:341
- `initials(s)` · js/state.js:345

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
- `positionRows()` · js/finance.js:117
- `accValue(a, rows)` · js/finance.js:129
- `derivRows()` · js/finance.js:131
- `derivSummary()` · js/finance.js:171
- `netWorth()` · js/finance.js:183
- `investmentSummary()` · js/finance.js:190
- `snapshot()` · js/finance.js:203
- `bankHistory(days = 365)` · js/finance.js:209
- `reliableHistory(points)` · js/finance.js:220
- `netSeries(days)` · js/finance.js:231
- `changeWindow(days)` · js/finance.js:244
- `invSeries(days)` · js/finance.js:264
### Flujo mensual, previsiones y alertas · línea 287
- `monthTotals(m = monthKey(today()` · js/finance.js:288
- `lastMonths(n)` · js/finance.js:295
- `recurring()` · js/finance.js:297
- `liquidity()` · js/finance.js:309
- `avgMonthlyExpense()` · js/finance.js:310
- `cushion()` · js/finance.js:315
- `pace()` · js/finance.js:316
- `upcoming(days = 31)` · js/finance.js:321
- `forecast()` · js/finance.js:334
- `safeToSpend()` · js/finance.js:346
- `topMerchants(m, n = 5)` · js/finance.js:353
- `dailySpend(m)` · js/finance.js:354
- `goalSaved(g)` · js/finance.js:355
- `alerts()` · js/finance.js:357
### Fiscalidad España (FIFO, base del ahorro, Modelo 721) · línea 380
- `cuotaAhorro(base)` · js/finance.js:382
- `matchTransfers(L)` · js/finance.js:383
- `taxGroups()` · js/finance.js:392
- `taxPrefetch(onStep)` · js/finance.js:397
- `taxCompute()` · js/finance.js:408
- `costBasis()` · js/finance.js:453
- `balancesAt(date)` · js/finance.js:454
- `modelo721(year)` · js/finance.js:455
- `taxSummary(year, extra = 0)` · js/finance.js:461
- `byCoin(disp)` · js/finance.js:466
- `taxCSV(year)` · js/finance.js:467
- `taxAIText(year)` · js/finance.js:476

## js/charts.js
### Estado de interfaz y gráficos interactivos SVG (propios, sin librerías) · línea 1
- `rangeBtns()` · js/charts.js:14
- `svgLine(pts, { h, w, id = 'nw', col, axis = true } = )` · js/charts.js:16
- `svgCandles(candles, { h, w, id = 'ohlcv', sym = 'BTC', s)` · js/charts.js:39
- `svgCompare(m)` · js/charts.js:107
- `svgDays(m)` · js/charts.js:129
- `svgMonths(months)` · js/charts.js:141
- `spendCalendarHTML(m)` · js/charts.js:148
- `donut(entries, { id = 'cats', label = 'Gastado', to)` · js/charts.js:163
- `allocBar(parts)` · js/charts.js:170
- `bindCharts(root = document)` · js/charts.js:175

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
- `openMapper(rows, fname, rawText = '')` · js/importers.js:242
- `openPositionsImport(rows, head, fname, map)` · js/importers.js:270
- `importBackup(o)` · js/importers.js:294
- `openAIImportModal(opts = {})` · js/importers.js:300

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
- `api(path, opts = {})` · js/connectors.js:4
- `syncBalances(manual = false)` · js/connectors.js:27
- `syncExchangeHistory(ex)` · js/connectors.js:51
- `syncOnChainWallets(manual = false)` · js/connectors.js:72
### Open Banking PSD2 gratuito (Enable Banking) · línea 95
- `openBankConnectModal()` · js/connectors.js:96
- `startBankAuth(aspspName, country)` · js/connectors.js:133
- `handleBankCallback()` · js/connectors.js:145
- `syncConnectedBanks(manual = false)` · js/connectors.js:171
- `saveVaultCredentials(group, opts = {})` · js/connectors.js:257
- `openConnectHub(initialTab = 'bancos')` · js/connectors.js:320

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
### Vistas de Escritorio (Centro de Control + Terminal Mercados) y componentes compartidos · línea 1
- `head(title, sub, actions = '')` · js/views-desktop.js:5
- `compactEmpty(title, text, action = '')` · js/views-desktop.js:6
- `changeCell(days, label)` · js/views-desktop.js:7
- `changeGridHTML(tag = 'div', attrs = '')` · js/views-desktop.js:11
- `accountLine(a, rows)` · js/views-desktop.js:36
- `homeAssets(rows)` · js/views-desktop.js:41
- `txItem(t)` · js/views-desktop.js:45
- `catRow(k, v, max, total, attrs)` · js/views-desktop.js:50
- `goalRow(g)` · js/views-desktop.js:54
- `holdingRow(x)` · js/views-desktop.js:59
- `accCard(a, rows)` · js/views-desktop.js:63
- `derivCardHTML(d)` · js/views-desktop.js:71
- `opsTable(ops, hideAcc = false)` · js/views-desktop.js:90
- `invDonut(list)` · js/views-desktop.js:95
- `workerInfoHTML(i)` · js/views-desktop.js:100
- `onboarding()` · js/views-desktop.js:107
### Barra superior Command Header y Drawer IA de Escritorio · línea 116
- `renderDesktopTopbar()` · js/views-desktop.js:117
- `renderAIDrawer()` · js/views-desktop.js:154
### 1. Inicio Escritorio (Centro de Control Bento — Sin duplicidades) · línea 167
- `vResumenDesktop()` · js/views-desktop.js:168
### 2. Terminal de Mercados, Velas en directo y Derivados (Escritorio) · línea 269
- `buildPortfolioContext()` · js/views-desktop.js:270
- `portfolioMetrics(list, total)` · js/views-desktop.js:281
- `watchlistSymbols(list)` · js/views-desktop.js:287
- `marketChartDeck(sym)` · js/views-desktop.js:291
- `vInvDesktop()` · js/views-desktop.js:310
### 3. Movimientos (Escritorio) · línea 379
- `filtered()` · js/views-desktop.js:380
- `vMovsDesktop()` · js/views-desktop.js:385
### 4. Cuentas y Detalle de Cuenta · línea 420
- `vAccountDetail(accId)` · js/views-desktop.js:421
- `vCuentasDesktop()` · js/views-desktop.js:444
### 5. Plan, Presupuestos y Alertas de precio · línea 456
- `vGoalsDesktop()` · js/views-desktop.js:457
### 6. Impuestos España · línea 474
- `vTax()` · js/views-desktop.js:475
### 7. Copiloto IA Studio (Escritorio) · línea 496
- `vCopilotDesktop()` · js/views-desktop.js:497
### 8. Ajustes · línea 518
- `vAjustes()` · js/views-desktop.js:520
- `vMasDesktop()` · js/views-desktop.js:547

## js/views-mobile.js
### Vistas Móviles (experiencia táctil inspirada en Revolut, Santander y TradingView móvil) · línea 1
- `vResumenMobile()` · js/views-mobile.js:4
- `vInvMobile()` · js/views-mobile.js:52
- `vMovsMobile()` · js/views-mobile.js:87
- `vCuentasMobile()` · js/views-mobile.js:115
- `vCopilotMobile()` · js/views-mobile.js:123

## js/app.js
### Navegación, ventanas modales, acciones, gestos y arranque · línea 1
- `go(v, f)` · js/app.js:31
- `navBtn(id, n, i, clsName = 'nav')` · js/app.js:46
- `sideNav()` · js/app.js:50
- `drawerNav()` · js/app.js:55
- `renderNav()` · js/app.js:57
- `render()` · js/app.js:71
### PWA · línea 85
- `installState()` · js/app.js:90
- `installApp()` · js/app.js:91
- `repairPWA()` · js/app.js:96
### Modales de edición, derivados, wallets, watchlist, detalle y búsqueda · línea 102
- `modal(title, html)` · js/app.js:103
- `editTx(id)` · js/app.js:111
- `quickAdd()` · js/app.js:122
- `editOp(id)` · js/app.js:137
- `editDeriv(id)` · js/app.js:150
- `closeDerivModal(id)` · js/app.js:162
- `editAcc(id)` · js/app.js:168
- `editWalletModal()` · js/app.js:179
- `editGoal(id)` · js/app.js:187
- `editPriceAlertModal(defaultSym = selectedSymbol || 'BTC')` · js/app.js:197
- `openAddWatchModal()` · js/app.js:206
- `assetIntelHTML(sym)` · js/app.js:228
- `assetDetail(sym)` · js/app.js:237
- `openCommandPalette()` · js/app.js:250
### Drawer móvil, Drawer IA y Gestos · línea 273
- `toggleAIDrawer(force)` · js/app.js:274
- `resetDrawerGesture()` · js/app.js:281
- `openDrawer()` · js/app.js:282
- `closeDrawer()` · js/app.js:283
- `gestureStart(e)` · js/app.js:286
- `gestureMove(e)` · js/app.js:298
- `gestureEnd(e)` · js/app.js:319
### Acciones centralizadas · línea 332
- `confirmTwice(el)` · js/app.js:333
- `act(a, el)` · js/app.js:335
- `afterRender()` · js/app.js:543
- `refreshAll(force)` · js/app.js:569
- `init()` · js/app.js:577
