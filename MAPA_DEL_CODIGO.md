# MAPA DEL CÓDIGO · Finanzas v11

Generado automáticamente. Busca por función; las líneas cambian.


## Utilidades · línea 563
- `localDate(d)` · línea 572
- `addDays(s,n)` · línea 573
- `monthAdd(m,n)` · línea 575
- `fmtDate(s,o={day:'numeric',month:'short'})` · línea 579
- `nf(n,d=2,min=d)` · línea 580
- `money(eur,opts={})` · línea 582
- `toNum(v)` · línea 593
- `toDate(v,dmy=true)` · línea 604

## Estado y guardado · línea 653
- `defaults()` · línea 659
- `load()` · línea 678
- `migrate(o)` · línea 683
- `autoBackup()` · línea 693
- `backupInfo()` · línea 701
- `restoreAutomaticBackup()` · línea 702
- `save(sync=true)` · línea 703
- `stampChanges(before)` · línea 710
- `change(fn,msg)` · línea 727
- `undo()` · línea 734
- `toast(text,canUndo=false)` · línea 744

## Categorías · línea 751
- `merchantOf(desc)` · línea 786
- `categorize(t)` · línea 794

## Importar archivos (Excel .xlsx y CSV) · línea 804
- `unzip(buf)` · línea 806
- `readXlsx(buf)` · línea 821
- `parseCSV(text)` · línea 828
- `findHeader(rows,needles)` · línea 842
- `detect(rows)` · línea 855
- `col(hs,...names)` · línea 859
- `parseBank(rows,fmt,head)` · línea 861
- `normAsset(a)` · línea 876
- `binanceKind(op,acct)` · línea 881
- `krakenKind(type,sub)` · línea 893
- `parseLedger(rows,fmt,head,map)` · línea 902
- `parseOFX(text)` · línea 933
- `parseQIF(text)` · línea 941
- `readFile(file)` · línea 947
- `importFiles(files)` · línea 956
- `openImport(rows,det,fname,map)` · línea 968
- `openMapper(rows,fname)` · línea 1004
- `openPositionsImport(rows,head,fname,map)` · línea 1029
- `importBackup(o)` · línea 1037

## Activos y precios · línea 1043
- `ensureAsset(sym)` · línea 1048
- `priceEUR(sym)` · línea 1051
- `fx(cur)` · línea 1057
- `trackedAssets()` · línea 1059
- `refreshPrices(force=false)` · línea 1066
- `directPrices(cryptos)` · línea 1081
- `priceAt(sym,t)` · línea 1089

## Cartera: qué tienes y cuánto vale · línea 1106
- `bankBalance(a)` · línea 1107
- `positionRows()` · línea 1116
- `derivRows()` · línea 1128
- `netWorth()` · línea 1137
- `investmentSummary()` · línea 1145
- `snapshot()` · línea 1153
- `bankHistory(days=365)` · línea 1160
- `reliableHistory(points)` · línea 1171
- `netSeries(days)` · línea 1183
- `changeWindow(days)` · línea 1195

## Movimientos: resúmenes del mes · línea 1203
- `monthTotals(m)` · línea 1204
- `lastMonths(n)` · línea 1211
- `recurring()` · línea 1213

## Análisis: de un vistazo · línea 1225
- `liquidity()` · línea 1227
- `avgMonthlyExpense()` · línea 1229
- `cushion()` · línea 1231
- `pace()` · línea 1233
- `upcoming(days=31)` · línea 1239
- `forecast()` · línea 1249
- `topMerchants(m,n=5)` · línea 1261
- `dailySpend(m)` · línea 1262
- `insights()` · línea 1264

## Fiscalidad (España): FIFO, base del ahorro, borrador · línea 1277
- `cuotaAhorro(base)` · línea 1280
- `matchTransfers(L)` · línea 1282
- `taxGroups()` · línea 1288
- `taxPrefetch(onStep)` · línea 1294
- `taxCompute()` · línea 1303
- `balancesAt(date)` · línea 1344
- `modelo721(year)` · línea 1345
- `taxSummary(year,extra=0)` · línea 1351
- `byCoin(disp)` · línea 1356

## Conexión con el Worker (exchanges, precios, sincronización) · línea 1358
- `api(path,opts={})` · línea 1360
- `syncBalances(manual=false)` · línea 1379

## Sincronización cifrada entre dispositivos · línea 1400
- `b64u(b)` · línea 1403
- `syncKey()` · línea 1405
- `syncId()` · línea 1406
- `syncPayload()` · línea 1408
- `encrypt(obj)` · línea 1409
- `decrypt(s)` · línea 1415
- `mergeStates(local,remote)` · línea 1421
- `scheduleSync(ms=1500)` · línea 1448
- `syncNow(manual=false)` · línea 1449
- `ago(t)` · línea 1485
- `paintSync()` · línea 1486
- `pairLink()` · línea 1495
- `readPair()` · línea 1496

## Avisos · línea 1505
- `alerts()` · línea 1506

## Gráficos interactivos (SVG propios, sin librerías) · línea 1523
- `svgLine(pts,{h,w,id='nw',col}={})` · línea 1528
- `svgCompare(m)` · línea 1543
- `svgDays(m)` · línea 1557
- `svgMonths(months)` · línea 1566
- `donut(entries,{id='cats',label='Gastado',total}={})` · línea 1573
- `allocBar(parts,total)` · línea 1579
- `bindCharts(root=document)` · línea 1583

## Instalación PWA, radar y Copiloto · línea 1616
- `installState()` · línea 1621
- `installApp()` · línea 1622
- `repairPWA()` · línea 1627
- `aiPayload(kind)` · línea 1632
- `localAdvice(kind)` · línea 1638
- `portfolioMetricsFromPayload(rows)` · línea 1666
- `runAI(kind)` · línea 1667
- `vCopilot()` · línea 1678
- `calcTechnical(closes)` · línea 1686
- `loadAssetIntel(sym)` · línea 1691
- `loadRadar()` · línea 1697
- `assetIntelHTML(sym)` · línea 1698

## Navegación · línea 1700
- `go(v,f)` · línea 1707
- `navBtn(id,n,i,cls='nav')` · línea 1713
- `navBtns(cls)` · línea 1714
- `sideNav()` · línea 1715
- `drawerNav()` · línea 1716
- `renderNav()` · línea 1717
- `render()` · línea 1726
- `head(title,sub,actions='')` · línea 1736
- `catInitials(c)` · línea 1738
- `initials(s)` · línea 1740
- `assetColor(sym)` · línea 1742
- `moneyBig(eur)` · línea 1744
- `rangeBtns()` · línea 1749
- `deltaPill(chg,base,txt)` · línea 1751

## Inicio · línea 1754
- `accountLine(a,rows)` · línea 1755
- `homeAssets(rows)` · línea 1759
- `changeCell(days,label)` · línea 1763
- `compactEmpty(title,text,action)` · línea 1766
- `vResumenMobile()` · línea 1767
- `greeting()` · línea 1781
- `safeToSpend()` · línea 1783
- `accValue(a,rows)` · línea 1784
- `accCard(a,rows)` · línea 1785
- `vResumen()` · línea 1790
- `catRow(k,v,max,total,attrs)` · línea 1809
- `onboarding()` · línea 1813
- `txItem(t)` · línea 1821
- `goalRow(g)` · línea 1825
- `goalSaved(g)` · línea 1830

## Movimientos (pestaña «Gastos») · línea 1832
- `filtered()` · línea 1833
- `vMovs()` · línea 1838
- `editTx(id)` · línea 1866
- `quickAdd()` · línea 1877

## Objetivos y presupuestos · línea 1892
- `vGoals()` · línea 1893
- `editGoal(id)` · línea 1901

## Inversiones · línea 1911
- `costBasis()` · línea 1912
- `invSeries(days)` · línea 1914
- `portfolioMetrics(list,total)` · línea 1918
- `portfolioScore(pm,coverage)` · línea 1921
- `decisionPanel(pm,coverage,list)` · línea 1926
- `scenarioPanel(total)` · línea 1936
- `exposurePanel(dn,pm)` · línea 1940
- `marketTabs()` · línea 1941
- `positionsPanel(list,ops,ders)` · línea 1942
- `vInv()` · línea 1943
- `holdingRow(x)` · línea 1956
- `riskStrip(pm,list,total)` · línea 1957
- `radarHTML(trends)` · línea 1958
- `invDonut(list,total)` · línea 1962
- `accTable(rows)` · línea 1963
- `opsTable(ops)` · línea 1968
- `tvSymbol(sym)` · línea 1973
- `tradingViewURL(sym)` · línea 1980
- `assetDetail(sym)` · línea 1981
- `editOp(id)` · línea 1993
- `editDeriv(id)` · línea 2005

## Impuestos · línea 2018
- `vTax()` · línea 2020
- `taxCSV(year)` · línea 2044
- `taxAIText(year)` · línea 2053

## Cuentas · línea 2064
- `vCuentas()` · línea 2067
- `editAcc(id)` · línea 2077

## Ajustes · línea 2088
- `vAjustes()` · línea 2090
- `workerInfoHTML(i)` · línea 2109
- `vMas()` · línea 2114

## Ventana, descargas y acciones · línea 2128
- `modal(title,html)` · línea 2129
- `download(name,text,type='application/json')` · línea 2130
- `copyText(t,msg='Copiado')` · línea 2131
- `resetDrawerGesture()` · línea 2135
- `openDrawer()` · línea 2136
- `closeDrawer()` · línea 2137
- `gestureStart(e)` · línea 2139
- `gestureMove(e)` · línea 2151
- `gestureEnd(e)` · línea 2165
- `act(a,el)` · línea 2173
- `confirmTwice(el)` · línea 2266
- `afterRender()` · línea 2306

## Arranque · línea 2324
- `refreshAll(force)` · línea 2326
- `init()` · línea 2332
