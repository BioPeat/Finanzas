# MAPA DEL CÓDIGO · Finanzas v8

Generado automáticamente. Busca por función; las líneas cambian.


## Utilidades · línea 547
- `localDate(d)` · línea 556
- `addDays(s,n)` · línea 557
- `monthAdd(m,n)` · línea 559
- `fmtDate(s,o={day:'numeric',month:'short'})` · línea 563
- `nf(n,d=2,min=d)` · línea 564
- `money(eur,opts={})` · línea 566
- `toNum(v)` · línea 577
- `toDate(v,dmy=true)` · línea 588

## Estado y guardado · línea 637
- `defaults()` · línea 643
- `load()` · línea 662
- `migrate(o)` · línea 667
- `autoBackup()` · línea 677
- `backupInfo()` · línea 685
- `restoreAutomaticBackup()` · línea 686
- `save(sync=true)` · línea 687
- `stampChanges(before)` · línea 694
- `change(fn,msg)` · línea 711
- `undo()` · línea 718
- `toast(text,canUndo=false)` · línea 728

## Categorías · línea 735
- `merchantOf(desc)` · línea 770
- `categorize(t)` · línea 778

## Importar archivos (Excel .xlsx y CSV) · línea 788
- `unzip(buf)` · línea 790
- `readXlsx(buf)` · línea 805
- `parseCSV(text)` · línea 812
- `findHeader(rows,needles)` · línea 826
- `detect(rows)` · línea 839
- `col(hs,...names)` · línea 843
- `parseBank(rows,fmt,head)` · línea 845
- `normAsset(a)` · línea 860
- `binanceKind(op,acct)` · línea 865
- `krakenKind(type,sub)` · línea 877
- `parseLedger(rows,fmt,head,map)` · línea 886
- `parseOFX(text)` · línea 917
- `parseQIF(text)` · línea 925
- `readFile(file)` · línea 931
- `importFiles(files)` · línea 940
- `openImport(rows,det,fname,map)` · línea 952
- `openMapper(rows,fname)` · línea 988
- `openPositionsImport(rows,head,fname,map)` · línea 1013
- `importBackup(o)` · línea 1021

## Activos y precios · línea 1027
- `ensureAsset(sym)` · línea 1032
- `priceEUR(sym)` · línea 1035
- `fx(cur)` · línea 1041
- `trackedAssets()` · línea 1043
- `refreshPrices(force=false)` · línea 1050
- `directPrices(cryptos)` · línea 1065
- `priceAt(sym,t)` · línea 1073

## Cartera: qué tienes y cuánto vale · línea 1090
- `bankBalance(a)` · línea 1091
- `positionRows()` · línea 1100
- `derivRows()` · línea 1112
- `netWorth()` · línea 1121
- `investmentSummary()` · línea 1129
- `snapshot()` · línea 1137
- `bankHistory(days=365)` · línea 1144
- `reliableHistory(points)` · línea 1155
- `netSeries(days)` · línea 1167
- `changeWindow(days)` · línea 1179

## Movimientos: resúmenes del mes · línea 1187
- `monthTotals(m)` · línea 1188
- `lastMonths(n)` · línea 1195
- `recurring()` · línea 1197

## Análisis: de un vistazo · línea 1209
- `liquidity()` · línea 1211
- `avgMonthlyExpense()` · línea 1213
- `cushion()` · línea 1215
- `pace()` · línea 1217
- `upcoming(days=31)` · línea 1223
- `forecast()` · línea 1233
- `topMerchants(m,n=5)` · línea 1245
- `dailySpend(m)` · línea 1246
- `insights()` · línea 1248

## Fiscalidad (España): FIFO, base del ahorro, borrador · línea 1261
- `cuotaAhorro(base)` · línea 1264
- `matchTransfers(L)` · línea 1266
- `taxGroups()` · línea 1272
- `taxPrefetch(onStep)` · línea 1278
- `taxCompute()` · línea 1287
- `balancesAt(date)` · línea 1328
- `modelo721(year)` · línea 1329
- `taxSummary(year,extra=0)` · línea 1335
- `byCoin(disp)` · línea 1340

## Conexión con el Worker (exchanges, precios, sincronización) · línea 1342
- `api(path,opts={})` · línea 1344
- `syncBalances(manual=false)` · línea 1363

## Sincronización cifrada entre dispositivos · línea 1384
- `b64u(b)` · línea 1387
- `syncKey()` · línea 1389
- `syncId()` · línea 1390
- `syncPayload()` · línea 1392
- `encrypt(obj)` · línea 1393
- `decrypt(s)` · línea 1399
- `mergeStates(local,remote)` · línea 1405
- `scheduleSync(ms=1500)` · línea 1432
- `syncNow(manual=false)` · línea 1433
- `ago(t)` · línea 1469
- `paintSync()` · línea 1470
- `pairLink()` · línea 1479
- `readPair()` · línea 1480

## Avisos · línea 1489
- `alerts()` · línea 1490

## Gráficos interactivos (SVG propios, sin librerías) · línea 1507
- `svgLine(pts,{h,w,id='nw',col}={})` · línea 1512
- `svgCompare(m)` · línea 1527
- `svgDays(m)` · línea 1541
- `svgMonths(months)` · línea 1550
- `donut(entries,{id='cats',label='Gastado',total}={})` · línea 1557
- `allocBar(parts,total)` · línea 1563
- `bindCharts(root=document)` · línea 1567

## Instalación PWA, radar y Copiloto · línea 1600
- `installState()` · línea 1605
- `installApp()` · línea 1606
- `repairPWA()` · línea 1611
- `aiPayload(kind)` · línea 1616
- `localAdvice(kind)` · línea 1622
- `portfolioMetricsFromPayload(rows)` · línea 1650
- `runAI(kind)` · línea 1651
- `vCopilot()` · línea 1662
- `calcTechnical(closes)` · línea 1670
- `loadAssetIntel(sym)` · línea 1675
- `loadRadar()` · línea 1681
- `assetIntelHTML(sym)` · línea 1682

## Navegación · línea 1684
- `go(v,f)` · línea 1691
- `navBtn(id,n,i,cls='nav')` · línea 1697
- `navBtns(cls)` · línea 1698
- `sideNav()` · línea 1699
- `drawerNav()` · línea 1700
- `renderNav()` · línea 1701
- `render()` · línea 1710
- `head(title,sub,actions='')` · línea 1720
- `catInitials(c)` · línea 1722
- `initials(s)` · línea 1724
- `assetColor(sym)` · línea 1726
- `moneyBig(eur)` · línea 1728
- `rangeBtns()` · línea 1733
- `deltaPill(chg,base,txt)` · línea 1735

## Inicio · línea 1738
- `accountLine(a,rows)` · línea 1739
- `homeAssets(rows)` · línea 1743
- `changeCell(days,label)` · línea 1747
- `compactEmpty(title,text,action)` · línea 1750
- `vResumenMobile()` · línea 1751
- `greeting()` · línea 1765
- `safeToSpend()` · línea 1767
- `accValue(a,rows)` · línea 1768
- `accCard(a,rows)` · línea 1769
- `vResumen()` · línea 1774
- `catRow(k,v,max,total,attrs)` · línea 1792
- `onboarding()` · línea 1796
- `txItem(t)` · línea 1804
- `goalRow(g)` · línea 1808
- `goalSaved(g)` · línea 1813

## Movimientos (pestaña «Gastos») · línea 1815
- `filtered()` · línea 1816
- `vMovs()` · línea 1821
- `editTx(id)` · línea 1849
- `quickAdd()` · línea 1860

## Objetivos y presupuestos · línea 1875
- `vGoals()` · línea 1876
- `editGoal(id)` · línea 1884

## Inversiones · línea 1894
- `costBasis()` · línea 1895
- `invSeries(days)` · línea 1897
- `portfolioMetrics(list,total)` · línea 1901
- `portfolioScore(pm,coverage)` · línea 1904
- `decisionPanel(pm,coverage,list)` · línea 1909
- `scenarioPanel(total)` · línea 1919
- `exposurePanel(dn,pm)` · línea 1923
- `marketTabs()` · línea 1924
- `positionsPanel(list,ops,ders)` · línea 1925
- `vInv()` · línea 1926
- `holdingRow(x)` · línea 1939
- `riskStrip(pm,list,total)` · línea 1940
- `radarHTML(trends)` · línea 1941
- `invDonut(list,total)` · línea 1945
- `accTable(rows)` · línea 1946
- `opsTable(ops)` · línea 1951
- `tvSymbol(sym)` · línea 1956
- `tradingViewURL(sym)` · línea 1963
- `assetDetail(sym)` · línea 1964
- `editOp(id)` · línea 1976
- `editDeriv(id)` · línea 1988

## Impuestos · línea 2001
- `vTax()` · línea 2003
- `taxCSV(year)` · línea 2027
- `taxAIText(year)` · línea 2036

## Cuentas · línea 2047
- `vCuentas()` · línea 2050
- `editAcc(id)` · línea 2060

## Ajustes · línea 2071
- `vAjustes()` · línea 2073
- `workerInfoHTML(i)` · línea 2092
- `vMas()` · línea 2097

## Ventana, descargas y acciones · línea 2111
- `modal(title,html)` · línea 2112
- `download(name,text,type='application/json')` · línea 2113
- `copyText(t,msg='Copiado')` · línea 2114
- `resetDrawerGesture()` · línea 2118
- `openDrawer()` · línea 2119
- `closeDrawer()` · línea 2120
- `gestureStart(e)` · línea 2122
- `gestureMove(e)` · línea 2130
- `gestureEnd(e)` · línea 2141
- `act(a,el)` · línea 2148
- `confirmTwice(el)` · línea 2241
- `afterRender()` · línea 2280

## Arranque · línea 2298
- `refreshAll(force)` · línea 2300
- `init()` · línea 2306
