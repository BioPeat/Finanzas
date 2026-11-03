# MAPA DEL CÓDIGO · Finanzas v3

Generado solo. Sirve para orientarse: busca siempre por el nombre de la función, las líneas cambian.

- constante `APP_VERSION` · línea 408

## Utilidades (línea 410)
- `localDate(d)` · línea 419
- `addDays(s,n)` · línea 420
- `monthAdd(m,n)` · línea 422
- constante `MONTHS` · línea 423
- `fmtDate(s,o={day:'numeric',month:'short'})` · línea 426
- `nf(n,d=2,min=d)` · línea 427
- `money(eur,opts={})` · línea 429
- `toNum(v)` · línea 440
- `toDate(v,dmy=true)` · línea 450
- constante `ICON` · línea 461

## Estado y guardado (línea 494)
- constante `LISTS` · línea 497
- constante `MAPS` · línea 498
- constante `SHARED` · línea 499
- `defaults()` · línea 500
- `load()` · línea 518
- `migrate(o)` · línea 523
- `save(sync=true)` · línea 532
- `stampChanges(before)` · línea 539
- `change(fn,msg)` · línea 556
- `undo()` · línea 563
- `toast(text,canUndo=false)` · línea 573

## Categorías (línea 580)
- constante `CATS` · línea 582
- constante `RULES_BASE` · línea 594
- `merchantOf(desc)` · línea 615
- `categorize(t)` · línea 623

## Importar archivos (Excel .xlsx y CSV) (línea 633)
- `unzip(buf)` · línea 635
- `readXlsx(buf)` · línea 650
- `parseCSV(text)` · línea 667
- `findHeader(rows,needles)` · línea 681
- constante `FORMATS` · línea 686
- `detect(rows)` · línea 694
- `col(hs,...names)` · línea 698
- `parseBank(rows,fmt,head)` · línea 700
- `normAsset(a)` · línea 715
- `binanceKind(op,acct)` · línea 720
- `krakenKind(type,sub)` · línea 732
- `parseLedger(rows,fmt,head,map)` · línea 741
- `readFile(file)` · línea 772
- `importFiles(files)` · línea 778
- `openImport(rows,det,fname,map)` · línea 790
- `openMapper(rows,fname)` · línea 826
- `importBackup(o)` · línea 848

## Activos y precios (línea 854)
- constante `FIAT` · línea 855
- constante `STABLE` · línea 856
- constante `CLASS_NAMES` · línea 857
- constante `CLASS_COLOR` · línea 858
- `ensureAsset(sym)` · línea 859
- `priceEUR(sym)` · línea 862
- `fx(cur)` · línea 868
- `trackedAssets()` · línea 870
- `refreshPrices(force=false)` · línea 877
- `directPrices(cryptos)` · línea 892
- `priceAt(sym,t)` · línea 900

## Cartera: qué tienes y cuánto vale (línea 917)
- `bankBalance(a)` · línea 918
- `positionRows()` · línea 927
- `derivRows()` · línea 939
- `netWorth()` · línea 948
- `snapshot()` · línea 955
- `bankHistory(days=365)` · línea 962
- `netSeries(days)` · línea 973

## Movimientos: resúmenes del mes (línea 980)
- `monthTotals(m)` · línea 981
- `lastMonths(n)` · línea 988
- `recurring()` · línea 990

## Análisis: de un vistazo (línea 1002)
- `liquidity()` · línea 1004
- `avgMonthlyExpense()` · línea 1006
- `cushion()` · línea 1008
- `pace()` · línea 1010
- `upcoming(days=31)` · línea 1016
- `forecast()` · línea 1026
- `topMerchants(m,n=5)` · línea 1038
- `dailySpend(m)` · línea 1039
- `insights()` · línea 1041

## Fiscalidad (España): FIFO, base del ahorro, borrador (línea 1054)
- constante `TRAMOS_AHORRO` · línea 1056
- `cuotaAhorro(base)` · línea 1057
- `matchTransfers(L)` · línea 1059
- `taxGroups()` · línea 1065
- `taxPrefetch(onStep)` · línea 1071
- `taxCompute()` · línea 1080
- `balancesAt(date)` · línea 1121
- `modelo721(year)` · línea 1122
- `taxSummary(year,extra=0)` · línea 1128
- `byCoin(disp)` · línea 1133

## Conexión con el Worker (exchanges, precios, sincronización) (línea 1135)
- `api(path,opts={})` · línea 1136
- constante `EXCH` · línea 1148
- `syncBalances(manual=false)` · línea 1150

## Sincronización cifrada entre dispositivos (línea 1170)
- `b64u(b)` · línea 1173
- `syncKey()` · línea 1175
- `syncId()` · línea 1176
- constante `LOCAL_ONLY` · línea 1177
- `syncPayload()` · línea 1178
- `encrypt(obj)` · línea 1179
- `decrypt(s)` · línea 1185
- `mergeStates(local,remote)` · línea 1191
- `scheduleSync(ms=1500)` · línea 1218
- `syncNow(manual=false)` · línea 1219
- `ago(t)` · línea 1248
- `paintSync()` · línea 1249
- `pairLink()` · línea 1258
- `readPair()` · línea 1259

## Avisos (línea 1268)
- `alerts()` · línea 1269

## Gráficos interactivos (SVG propios, sin librerías) (línea 1286)
- constante `CHARTS` · línea 1288
- `svgLine(pts,{h,w,id='nw',col}={})` · línea 1291
- `svgCompare(m)` · línea 1306
- `svgDays(m)` · línea 1320
- `svgMonths(months)` · línea 1329
- `donut(entries,{id='cats',label='Gastado',total)` · línea 1336
- `allocBar(parts,total)` · línea 1342
- `bindCharts(root=document)` · línea 1346

## Navegación (línea 1378)
- constante `VIEWS` · línea 1380
- constante `TABS` · línea 1381
- constante `RANGES` · línea 1383
- `go(v,f)` · línea 1384
- `navBtns(cls)` · línea 1385
- `renderNav()` · línea 1386
- `render()` · línea 1395
- `head(title,sub,actions='')` · línea 1405
- `catInitials(c)` · línea 1407
- `initials(s)` · línea 1409
- `assetColor(sym)` · línea 1411
- `moneyBig(eur)` · línea 1413
- `rangeBtns()` · línea 1418
- `deltaPill(chg,base,txt)` · línea 1420
- constante `RANGE_TXT` · línea 1421

## Inicio (línea 1423)
- `greeting()` · línea 1424
- `safeToSpend()` · línea 1426
- `accValue(a,rows)` · línea 1427
- `accCard(a,rows)` · línea 1428
- `vResumen()` · línea 1433
- `catRow(k,v,max,total,attrs)` · línea 1469
- `onboarding()` · línea 1473
- `txItem(t)` · línea 1481
- `goalRow(g)` · línea 1485
- `goalSaved(g)` · línea 1490

## Movimientos (pestaña «Gastos») (línea 1492)
- `filtered()` · línea 1493
- `vMovs()` · línea 1498
- `editTx(id)` · línea 1526
- `quickAdd()` · línea 1537

## Objetivos y presupuestos (línea 1550)
- `vGoals()` · línea 1551
- `editGoal(id)` · línea 1559

## Inversiones (línea 1569)
- `costBasis()` · línea 1570
- `invSeries(days)` · línea 1572
- `vInv()` · línea 1576
- constante `PAL` · línea 1606
- `invDonut(list,total)` · línea 1607
- `accTable(rows)` · línea 1608
- constante `OPK` · línea 1612
- `opsTable(ops)` · línea 1613
- `assetDetail(sym)` · línea 1618
- `editOp(id)` · línea 1628
- `editDeriv(id)` · línea 1640

## Impuestos (línea 1653)
- `vTax()` · línea 1655
- `taxCSV(year)` · línea 1679
- `taxAIText(year)` · línea 1688

## Cuentas (línea 1699)
- constante `KIND_NAMES` · línea 1700
- constante `KIND_ICON` · línea 1701
- `vCuentas()` · línea 1702
- `editAcc(id)` · línea 1712

## Ajustes (línea 1723)
- constante `WORKER_STEPS` · línea 1724
- `vAjustes()` · línea 1725
- `workerInfoHTML(i)` · línea 1746
- `vMas()` · línea 1751

## Ventana, descargas y acciones (línea 1769)
- `modal(title,html)` · línea 1770
- `download(name,text,type='application/json')` · línea 1771
- `copyText(t,msg='Copiado')` · línea 1772
- `act(a,el)` · línea 1776
- `confirmTwice(el)` · línea 1857
- `afterRender()` · línea 1894

## Arranque (línea 1907)
- `refreshAll(force)` · línea 1909
- `init()` · línea 1915
