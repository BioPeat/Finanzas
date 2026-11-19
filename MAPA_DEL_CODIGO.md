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
- `autoBackup()` · js/state.js:153
- `backupInfo()` · js/state.js:161
- `restoreAutomaticBackup()` · js/state.js:162
- `save(sync = true)` · js/state.js:172
- `stampChanges(before)` · js/state.js:177
- `change(fn, msg)` · js/state.js:193
- `undo()` · js/state.js:200
- `toast(text, canUndo = false)` · js/state.js:209
### Sincronización cifrada entre dispositivos · línea 214
- `b64u(b)` · js/state.js:215
- `syncKey()` · js/state.js:217
- `syncId()` · js/state.js:218
- `syncPayload()` · js/state.js:219
- `encrypt(obj)` · js/state.js:220
- `decrypt(s)` · js/state.js:226
- `mergeStates(local, remote)` · js/state.js:231
- `scheduleSync(ms = 1500)` · js/state.js:260
- `syncNow(manual = false)` · js/state.js:261
- `ago(t)` · js/state.js:297
- `paintSync()` · js/state.js:298
- `pairLink()` · js/state.js:311
- `readPair()` · js/state.js:312
- `instKey(a)` · js/state.js:325
- `assetColor(sym)` · js/state.js:334
- `catInitials(c)` · js/state.js:340
- `initials(s)` · js/state.js:344

## js/finance.js
### Categorías, finanzas, cartera, derivados, análisis y fiscalidad España · línea 1
- `merchantOf(desc)` · js/finance.js:38
- `categorize(t)` · js/finance.js:46
### Activos, divisas y normalización · línea 56
- `normAsset(a)` · js/finance.js:64
- `baseSym(instr)` · js/finance.js:69
- `ensureAsset(sym)` · js/finance.js:76
- `fx(cur)` · js/finance.js:78
- `priceEUR(sym)` · js/finance.js:79
- `trackedAssets()` · js/finance.js:85
### Cartera, saldos y derivados en tiempo real · línea 94
- `bankBalance(a)` · js/finance.js:95
- `positionRows()` · js/finance.js:103
- `accValue(a, rows)` · js/finance.js:115
- `derivRows()` · js/finance.js:117
- `derivSummary()` · js/finance.js:157
- `netWorth()` · js/finance.js:167
- `investmentSummary()` · js/finance.js:174
- `snapshot()` · js/finance.js:187
- `bankHistory(days = 365)` · js/finance.js:193
- `reliableHistory(points)` · js/finance.js:204
- `netSeries(days)` · js/finance.js:215
- `changeWindow(days)` · js/finance.js:227
- `invSeries(days)` · js/finance.js:247
### Flujo mensual, previsiones y alertas · línea 270
- `monthTotals(m)` · js/finance.js:271
- `lastMonths(n)` · js/finance.js:277
- `recurring()` · js/finance.js:279
- `liquidity()` · js/finance.js:291
- `avgMonthlyExpense()` · js/finance.js:292
- `cushion()` · js/finance.js:297
- `pace()` · js/finance.js:298
- `upcoming(days = 31)` · js/finance.js:303
- `forecast()` · js/finance.js:316
- `safeToSpend()` · js/finance.js:328
- `topMerchants(m, n = 5)` · js/finance.js:335
- `dailySpend(m)` · js/finance.js:336
- `goalSaved(g)` · js/finance.js:337
- `alerts()` · js/finance.js:339
### Fiscalidad España (FIFO, base del ahorro, Modelo 721) · línea 362
- `cuotaAhorro(base)` · js/finance.js:364
- `matchTransfers(L)` · js/finance.js:365
- `taxGroups()` · js/finance.js:374
- `taxPrefetch(onStep)` · js/finance.js:379
- `taxCompute()` · js/finance.js:390
- `costBasis()` · js/finance.js:435
- `balancesAt(date)` · js/finance.js:436
- `modelo721(year)` · js/finance.js:437
- `taxSummary(year, extra = 0)` · js/finance.js:443
- `byCoin(disp)` · js/finance.js:448
- `taxCSV(year)` · js/finance.js:449
- `taxAIText(year)` · js/finance.js:458

## js/charts.js
### Estado de interfaz y gráficos interactivos SVG (propios, sin librerías) · línea 1
- `rangeBtns()` · js/charts.js:14
- `svgLine(pts, { h, w, id = 'nw', col, axis = true } = )` · js/charts.js:16
- `svgCandles(candles, { h, w, id = 'ohlcv', sym = 'BTC', s)` · js/charts.js:37
- `svgCompare(m)` · js/charts.js:100
- `svgDays(m)` · js/charts.js:114
- `svgMonths(months)` · js/charts.js:126
- `spendCalendarHTML(m)` · js/charts.js:133
- `donut(entries, { id = 'cats', label = 'Gastado', to)` · js/charts.js:148
- `allocBar(parts)` · js/charts.js:155
- `bindCharts(root = document)` · js/charts.js:160

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
- `startBankAuth(aspspName, country)` · js/connectors.js:131
- `handleBankCallback()` · js/connectors.js:143
- `syncConnectedBanks(manual = false)` · js/connectors.js:169
- `openConnectHub()` · js/connectors.js:191

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
- `accountLine(a, rows)` · js/views-desktop.js:11
- `homeAssets(rows)` · js/views-desktop.js:16
- `txItem(t)` · js/views-desktop.js:20
- `catRow(k, v, max, total, attrs)` · js/views-desktop.js:24
- `goalRow(g)` · js/views-desktop.js:28
- `holdingRow(x)` · js/views-desktop.js:33
- `accCard(a, rows)` · js/views-desktop.js:37
- `derivCardHTML(d)` · js/views-desktop.js:43
- `opsTable(ops, hideAcc = false)` · js/views-desktop.js:62
- `invDonut(list)` · js/views-desktop.js:67
- `workerInfoHTML(i)` · js/views-desktop.js:72
- `onboarding()` · js/views-desktop.js:79
### Barra superior en directo y Drawer IA de Escritorio · línea 88
- `renderDesktopTopbar()` · js/views-desktop.js:89
- `renderAIDrawer()` · js/views-desktop.js:104
### 1. Inicio Escritorio (Centro de Control Bento) · línea 117
- `vResumenDesktop()` · js/views-desktop.js:118
### 2. Terminal de Mercados, Velas en directo y Derivados (Escritorio) · línea 164
- `buildPortfolioContext()` · js/views-desktop.js:165
- `portfolioMetrics(list, total)` · js/views-desktop.js:176
- `watchlistSymbols(list)` · js/views-desktop.js:182
- `marketChartDeck(sym)` · js/views-desktop.js:186
- `vInvDesktop()` · js/views-desktop.js:205
### 3. Movimientos (Escritorio) · línea 274
- `filtered()` · js/views-desktop.js:275
- `vMovsDesktop()` · js/views-desktop.js:280
### 4. Cuentas y Detalle de Cuenta · línea 315
- `vAccountDetail(accId)` · js/views-desktop.js:316
- `vCuentasDesktop()` · js/views-desktop.js:339
### 5. Plan, Presupuestos y Alertas de precio · línea 351
- `vGoalsDesktop()` · js/views-desktop.js:352
### 6. Impuestos España · línea 369
- `vTax()` · js/views-desktop.js:370
### 7. Copiloto IA Studio (Escritorio) · línea 391
- `vCopilotDesktop()` · js/views-desktop.js:392
### 8. Ajustes · línea 413
- `vAjustes()` · js/views-desktop.js:415
- `vMasDesktop()` · js/views-desktop.js:442

## js/views-mobile.js
### Vistas Móviles (experiencia táctil inspirada en Revolut, Santander y TradingView móvil) · línea 1
- `vResumenMobile()` · js/views-mobile.js:4
- `vInvMobile()` · js/views-mobile.js:48
- `vMovsMobile()` · js/views-mobile.js:83
- `vCuentasMobile()` · js/views-mobile.js:111
- `vCopilotMobile()` · js/views-mobile.js:119

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
