# MAPA DEL CÓDIGO · Finanzas v5

Generado solo. Sirve para orientarse: busca siempre por el nombre de la función, las líneas cambian.

- constante `APP_VERSION` · línea 485

## Utilidades (línea 487)
- `localDate(d)` · línea 496
- `addDays(s,n)` · línea 497
- `monthAdd(m,n)` · línea 499
- constante `MONTHS` · línea 500
- `fmtDate(s,o={day:'numeric',month:'short'})` · línea 503
- `nf(n,d=2,min=d)` · línea 504
- `money(eur,opts={})` · línea 506
- `toNum(v)` · línea 517
- `toDate(v,dmy=true)` · línea 528
- constante `ICON` · línea 539

## Estado y guardado (línea 573)
- constante `LISTS` · línea 576
- constante `MAPS` · línea 577
- constante `SHARED` · línea 578
- `defaults()` · línea 579
- `load()` · línea 597
- `migrate(o)` · línea 602
- `save(sync=true)` · línea 611
- `stampChanges(before)` · línea 618
- `change(fn,msg)` · línea 635
- `undo()` · línea 642
- `toast(text,canUndo=false)` · línea 652

## Categorías (línea 659)
- constante `CATS` · línea 661
- constante `RULES_BASE` · línea 673
- `merchantOf(desc)` · línea 694
- `categorize(t)` · línea 702

## Importar archivos (Excel .xlsx y CSV) (línea 712)
- `unzip(buf)` · línea 714
- `readXlsx(buf)` · línea 729
- `parseCSV(text)` · línea 736
- `findHeader(rows,needles)` · línea 750
- constante `FORMATS` · línea 755
- `detect(rows)` · línea 763
- `col(hs,...names)` · línea 767
- `parseBank(rows,fmt,head)` · línea 769
- `normAsset(a)` · línea 784
- `binanceKind(op,acct)` · línea 789
- `krakenKind(type,sub)` · línea 801
- `parseLedger(rows,fmt,head,map)` · línea 810
- `parseOFX(text)` · línea 841
- `parseQIF(text)` · línea 849
- `readFile(file)` · línea 855
- `importFiles(files)` · línea 864
- `openImport(rows,det,fname,map)` · línea 876
- `openMapper(rows,fname)` · línea 912
- `openPositionsImport(rows,head,fname,map)` · línea 937
- `importBackup(o)` · línea 945

## Activos y precios (línea 951)
- constante `FIAT` · línea 952
- constante `STABLE` · línea 953
- constante `CLASS_NAMES` · línea 954
- constante `CLASS_COLOR` · línea 955
- `ensureAsset(sym)` · línea 956
- `priceEUR(sym)` · línea 959
- `fx(cur)` · línea 965
- `trackedAssets()` · línea 967
- `refreshPrices(force=false)` · línea 974
- `directPrices(cryptos)` · línea 989
- `priceAt(sym,t)` · línea 997

## Cartera: qué tienes y cuánto vale (línea 1014)
- `bankBalance(a)` · línea 1015
- `positionRows()` · línea 1024
- `derivRows()` · línea 1036
- `netWorth()` · línea 1045
- `investmentSummary()` · línea 1053
- `snapshot()` · línea 1061
- `bankHistory(days=365)` · línea 1068
- `netSeries(days)` · línea 1079

## Movimientos: resúmenes del mes (línea 1086)
- `monthTotals(m)` · línea 1087
- `lastMonths(n)` · línea 1094
- `recurring()` · línea 1096

## Análisis: de un vistazo (línea 1108)
- `liquidity()` · línea 1110
- `avgMonthlyExpense()` · línea 1112
- `cushion()` · línea 1114
- `pace()` · línea 1116
- `upcoming(days=31)` · línea 1122
- `forecast()` · línea 1132
- `topMerchants(m,n=5)` · línea 1144
- `dailySpend(m)` · línea 1145
- `insights()` · línea 1147

## Fiscalidad (España): FIFO, base del ahorro, borrador (línea 1160)
- constante `TRAMOS_AHORRO` · línea 1162
- `cuotaAhorro(base)` · línea 1163
- `matchTransfers(L)` · línea 1165
- `taxGroups()` · línea 1171
- `taxPrefetch(onStep)` · línea 1177
- `taxCompute()` · línea 1186
- `balancesAt(date)` · línea 1227
- `modelo721(year)` · línea 1228
- `taxSummary(year,extra=0)` · línea 1234
- `byCoin(disp)` · línea 1239

## Conexión con el Worker (exchanges, precios, sincronización) (línea 1241)
- `api(path,opts={})` · línea 1242
- constante `EXCH` · línea 1254
- `syncBalances(manual=false)` · línea 1256

## Sincronización cifrada entre dispositivos (línea 1277)
- `b64u(b)` · línea 1280
- `syncKey()` · línea 1282
- `syncId()` · línea 1283
- constante `LOCAL_ONLY` · línea 1284
- `syncPayload()` · línea 1285
- `encrypt(obj)` · línea 1286
- `decrypt(s)` · línea 1292
- `mergeStates(local,remote)` · línea 1298
- `scheduleSync(ms=1500)` · línea 1325
- `syncNow(manual=false)` · línea 1326
- `ago(t)` · línea 1355
- `paintSync()` · línea 1356
- `pairLink()` · línea 1365
- `readPair()` · línea 1366

## Avisos (línea 1375)
- `alerts()` · línea 1376

## Gráficos interactivos (SVG propios, sin librerías) (línea 1393)
- constante `CHARTS` · línea 1395
- `svgLine(pts,{h,w,id='nw',col}={})` · línea 1398
- `svgCompare(m)` · línea 1413
- `svgDays(m)` · línea 1427
- `svgMonths(months)` · línea 1436
- `donut(entries,{id='cats',label='Gastado',total)` · línea 1443
- `allocBar(parts,total)` · línea 1449
- `bindCharts(root=document)` · línea 1453

## Navegación (línea 1485)
- constante `VIEWS` · línea 1487
- constante `TABS` · línea 1488
- constante `CORE_VIEWS` · línea 1489
- constante `RANGES` · línea 1491
- `go(v,f)` · línea 1492
- `navBtn(id,n,i,cls='nav')` · línea 1498
- `navBtns(cls)` · línea 1499
- `sideNav()` · línea 1500
- `drawerNav()` · línea 1501
- `renderNav()` · línea 1502
- `render()` · línea 1511
- `head(title,sub,actions='')` · línea 1521
- `catInitials(c)` · línea 1523
- `initials(s)` · línea 1525
- `assetColor(sym)` · línea 1527
- `moneyBig(eur)` · línea 1529
- `rangeBtns()` · línea 1534
- `deltaPill(chg,base,txt)` · línea 1536
- constante `RANGE_TXT` · línea 1537

## Inicio (línea 1539)
- `vResumenMobile()` · línea 1540
- `greeting()` · línea 1556
- `safeToSpend()` · línea 1558
- `accValue(a,rows)` · línea 1559
- `accCard(a,rows)` · línea 1560
- `vResumen()` · línea 1565
- `catRow(k,v,max,total,attrs)` · línea 1606
- `onboarding()` · línea 1610
- `txItem(t)` · línea 1618
- `goalRow(g)` · línea 1622
- `goalSaved(g)` · línea 1627

## Movimientos (pestaña «Gastos») (línea 1629)
- `filtered()` · línea 1630
- `vMovs()` · línea 1635
- `editTx(id)` · línea 1663
- `quickAdd()` · línea 1674

## Objetivos y presupuestos (línea 1689)
- `vGoals()` · línea 1690
- `editGoal(id)` · línea 1698

## Inversiones (línea 1708)
- `costBasis()` · línea 1709
- `invSeries(days)` · línea 1711
- `vInv()` · línea 1715
- constante `PAL` · línea 1745
- `invDonut(list,total)` · línea 1746
- `accTable(rows)` · línea 1747
- constante `OPK` · línea 1751
- `opsTable(ops)` · línea 1752
- `tvSymbol(sym)` · línea 1757
- `tradingViewURL(sym)` · línea 1764
- `assetDetail(sym)` · línea 1765
- `editOp(id)` · línea 1776
- `editDeriv(id)` · línea 1788

## Impuestos (línea 1801)
- `vTax()` · línea 1803
- `taxCSV(year)` · línea 1827
- `taxAIText(year)` · línea 1836

## Cuentas (línea 1847)
- constante `KIND_NAMES` · línea 1848
- constante `KIND_ICON` · línea 1849
- `vCuentas()` · línea 1850
- `editAcc(id)` · línea 1860

## Ajustes (línea 1871)
- constante `WORKER_STEPS` · línea 1872
- `vAjustes()` · línea 1873
- `workerInfoHTML(i)` · línea 1889
- `vMas()` · línea 1894

## Ventana, descargas y acciones (línea 1908)
- `modal(title,html)` · línea 1909
- `download(name,text,type='application/json')` · línea 1910
- `copyText(t,msg='Copiado')` · línea 1911
- `resetDrawerGesture()` · línea 1915
- `openDrawer()` · línea 1916
- `closeDrawer()` · línea 1917
- `gestureStart(e)` · línea 1919
- `gestureMove(e)` · línea 1927
- `gestureEnd(e)` · línea 1938
- `act(a,el)` · línea 1945
- `confirmTwice(el)` · línea 2029
- `afterRender()` · línea 2067

## Arranque (línea 2085)
- `refreshAll(force)` · línea 2087
- `init()` · línea 2093
