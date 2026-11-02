# MAPA DEL CÓDIGO · Finanzas v2

Generado solo. Sirve para orientarse: busca siempre por el nombre de la función, las líneas cambian.

- constante `APP_VERSION` · línea 301

## Utilidades (línea 303)
- `localDate(d)` · línea 312
- `addDays(s,n)` · línea 313
- `monthAdd(m,n)` · línea 315
- constante `MONTHS` · línea 316
- `fmtDate(s,o={day:'numeric',month:'short'})` · línea 319
- `nf(n,d=2,min=d)` · línea 320
- `money(eur,opts={})` · línea 322
- `toNum(v)` · línea 333
- `toDate(v,dmy=true)` · línea 343
- constante `ICON` · línea 354

## Estado y guardado (línea 385)
- constante `LISTS` · línea 388
- constante `MAPS` · línea 389
- constante `SHARED` · línea 390
- `defaults()` · línea 391
- `load()` · línea 409
- `migrate(o)` · línea 414
- `save(sync=true)` · línea 423
- `stampChanges(before)` · línea 430
- `change(fn,msg)` · línea 447
- `undo()` · línea 454
- `toast(text,canUndo=false)` · línea 464

## Categorías (línea 471)
- constante `CATS` · línea 473
- constante `RULES_BASE` · línea 485
- `merchantOf(desc)` · línea 506
- `categorize(t)` · línea 514

## Importar archivos (Excel .xlsx y CSV) (línea 524)
- `unzip(buf)` · línea 526
- `readXlsx(buf)` · línea 541
- `parseCSV(text)` · línea 558
- `findHeader(rows,needles)` · línea 572
- constante `FORMATS` · línea 577
- `detect(rows)` · línea 585
- `col(hs,...names)` · línea 589
- `parseBank(rows,fmt,head)` · línea 591
- `normAsset(a)` · línea 606
- `binanceKind(op,acct)` · línea 611
- `krakenKind(type,sub)` · línea 623
- `parseLedger(rows,fmt,head,map)` · línea 632
- `readFile(file)` · línea 663
- `importFiles(files)` · línea 669
- `openImport(rows,det,fname,map)` · línea 681
- `openMapper(rows,fname)` · línea 717
- `importBackup(o)` · línea 739

## Activos y precios (línea 745)
- constante `FIAT` · línea 746
- constante `STABLE` · línea 747
- constante `CLASS_NAMES` · línea 748
- constante `CLASS_COLOR` · línea 749
- `ensureAsset(sym)` · línea 750
- `priceEUR(sym)` · línea 753
- `fx(cur)` · línea 759
- `trackedAssets()` · línea 761
- `refreshPrices(force=false)` · línea 768
- `directPrices(cryptos)` · línea 783
- `priceAt(sym,t)` · línea 791

## Cartera: qué tienes y cuánto vale (línea 808)
- `bankBalance(a)` · línea 809
- `positionRows()` · línea 818
- `derivRows()` · línea 830
- `netWorth()` · línea 839
- `snapshot()` · línea 846
- `bankHistory(days=365)` · línea 853
- `netSeries(days)` · línea 864

## Movimientos: resúmenes del mes (línea 871)
- `monthTotals(m)` · línea 872
- `lastMonths(n)` · línea 879
- `recurring()` · línea 881

## Análisis: de un vistazo (línea 893)
- `liquidity()` · línea 895
- `avgMonthlyExpense()` · línea 897
- `cushion()` · línea 899
- `pace()` · línea 901
- `upcoming(days=31)` · línea 907
- `forecast()` · línea 917
- `topMerchants(m,n=5)` · línea 929
- `dailySpend(m)` · línea 930
- `insights()` · línea 932

## Fiscalidad (España): FIFO, base del ahorro, borrador (línea 945)
- constante `TRAMOS_AHORRO` · línea 947
- `cuotaAhorro(base)` · línea 948
- `matchTransfers(L)` · línea 950
- `taxGroups()` · línea 956
- `taxPrefetch(onStep)` · línea 962
- `taxCompute()` · línea 971
- `balancesAt(date)` · línea 1012
- `modelo721(year)` · línea 1013
- `taxSummary(year,extra=0)` · línea 1019
- `byCoin(disp)` · línea 1024

## Conexión con el Worker (exchanges, precios, sincronización) (línea 1026)
- `api(path,opts={})` · línea 1027
- constante `EXCH` · línea 1039
- `syncBalances(manual=false)` · línea 1041

## Sincronización cifrada entre dispositivos (línea 1061)
- `b64u(b)` · línea 1064
- `syncKey()` · línea 1066
- `syncId()` · línea 1067
- constante `LOCAL_ONLY` · línea 1068
- `syncPayload()` · línea 1069
- `encrypt(obj)` · línea 1070
- `decrypt(s)` · línea 1076
- `mergeStates(local,remote)` · línea 1082
- `scheduleSync(ms=1500)` · línea 1109
- `syncNow(manual=false)` · línea 1110
- `ago(t)` · línea 1139
- `paintSync()` · línea 1140
- `pairLink()` · línea 1149
- `readPair()` · línea 1150

## Avisos (línea 1159)
- `alerts()` · línea 1160

## Gráficos interactivos (SVG propios, sin librerías) (línea 1177)
- constante `CHARTS` · línea 1179
- `svgLine(pts,{h,w,id='nw'}={})` · línea 1181
- `svgMonths(months)` · línea 1195
- `donut(entries,{id='cats',label='Gastado',total)` · línea 1202
- `allocBar(parts,total)` · línea 1208
- `bindCharts(root=document)` · línea 1213

## Navegación (línea 1236)
- constante `VIEWS` · línea 1237
- constante `TABS` · línea 1238
- `go(v,f)` · línea 1240
- `navBtns(cls)` · línea 1241
- `renderNav()` · línea 1242
- `openDrawer()` · línea 1250
- `closeDrawer()` · línea 1251
- `render()` · línea 1252
- `head(title,sub,actions='')` · línea 1262
- `catInitials(c)` · línea 1264

## Inicio (línea 1266)
- `greeting()` · línea 1267
- `vResumen()` · línea 1268
- `onboarding()` · línea 1302
- `txItem(t)` · línea 1310
- `goalRow(g)` · línea 1314
- `goalSaved(g)` · línea 1319

## Movimientos (línea 1321)
- `filtered()` · línea 1322
- `spendCalendar(m)` · línea 1328
- `vMovs()` · línea 1335
- `editTx(id)` · línea 1357
- `quickAdd()` · línea 1368

## Objetivos y presupuestos (línea 1381)
- `vGoals()` · línea 1382
- `editGoal(id)` · línea 1390

## Inversiones (línea 1400)
- `costBasis()` · línea 1401
- `vInv()` · línea 1402
- constante `PAL` · línea 1428
- `invDonut(list,total)` · línea 1429
- `accTable(rows)` · línea 1430
- constante `OPK` · línea 1434
- `opsTable(ops)` · línea 1435
- `assetDetail(sym)` · línea 1440
- `editOp(id)` · línea 1450
- `editDeriv(id)` · línea 1462

## Impuestos (línea 1475)
- `vTax()` · línea 1477
- `taxCSV(year)` · línea 1501
- `taxAIText(year)` · línea 1510

## Cuentas (línea 1521)
- constante `KIND_NAMES` · línea 1522
- constante `KIND_ICON` · línea 1523
- `vCuentas()` · línea 1524
- `editAcc(id)` · línea 1537

## Ajustes (línea 1548)
- constante `WORKER_STEPS` · línea 1549
- `vAjustes()` · línea 1550
- `workerInfoHTML(i)` · línea 1571
- `vMas()` · línea 1576

## Ventana, descargas y acciones (línea 1582)
- `modal(title,html)` · línea 1583
- `download(name,text,type='application/json')` · línea 1584
- `copyText(t,msg='Copiado')` · línea 1585
- `act(a,el)` · línea 1589
- `confirmTwice(el)` · línea 1671
- `afterRender()` · línea 1706

## Arranque (línea 1718)
- `refreshAll(force)` · línea 1720
- `init()` · línea 1726
