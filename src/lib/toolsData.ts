/**
 * FLARE-VM Tools Data
 * Based on Mandiant VM-Packages from https://github.com/mandiant/VM-Packages
 * Categories from: https://github.com/mandiant/VM-Packages/blob/main/categories.txt
 */

export interface Tool {
  name: string;
  description: string;
  projectUrl?: string;
}

export interface ToolCategory {
  name: string;
  tools: Tool[];
}

export const defaultToolsData: ToolCategory[] = [
  {
    name: "Command and Control",
    tools: [
      { name: "Metasploit", description: "Penetration testing framework for developing and executing exploit code against targets." },
      { name: "WMImplant", description: "PowerShell WMI-based implant for command and control operations." },
      { name: "Covenant", description: "A .NET-based command and control framework for red team operations." },
      { name: "PoshC2", description: "A proxy aware C2 framework used to aid red team operations and penetration testing." },
      { name: "Sliver", description: "Adversary emulation framework supporting C2 over HTTPS, DNS, and more." },
    ],
  },
  {
    name: "Credential Access",
    tools: [
      { name: "hashcat", description: "Advanced password recovery utility supporting multiple hash algorithms.", projectUrl: "https://hashcat.net/hashcat/" },
      { name: "mimikatz", description: "Tool for extracting Windows credentials from memory and performing pass-the-hash attacks.", projectUrl: "https://github.com/gentilkiwi/mimikatz" },
      { name: "ADConnectDump", description: "Dump Azure AD Connect credentials for password sync accounts." },
      { name: "ASREPRoast", description: "Tool to retrieve crackable hashes from Kerberos AS-REP responses." },
      { name: "Certify", description: "Active Directory certificate abuse enumeration and exploitation tool." },
      { name: "CredNinja", description: "Multithreaded tool for testing credentials against domain controllers." },
      { name: "Dumpert", description: "LSASS memory dumper using direct syscalls to avoid detection.", projectUrl: "https://github.com/outflanknl/Dumpert" },
      { name: "LaZagne", description: "Password recovery tool supporting multiple applications and browsers." },
      { name: "Rubeus", description: "C# toolset for raw Kerberos interaction and ticket abuse." },
      { name: "SharpDPAPI", description: "C# implementation of DPAPI for credential decryption." },
    ],
  },
  {
    name: "Debuggers",
    tools: [
      { name: "x64dbg", description: "User mode debugger optimized for reverse engineering and malware analysis.", projectUrl: "https://github.com/x64dbg/x64dbg" },
      { name: "x32dbg", description: "32-bit version of x64dbg debugger for Windows." },
      { name: "ScyllaHide", description: "Anti-anti-debug plugin for x64dbg/OllyDbg — hides debugger from common detection techniques (IsDebuggerPresent, NtQueryInformationProcess, etc.).", projectUrl: "https://github.com/x64dbg/ScyllaHide" },
      { name: "WinDbg", description: "Microsoft's powerful debugger for Windows kernel and user mode debugging.", projectUrl: "https://docs.microsoft.com/en-us/windows-hardware/drivers/debugger/" },
      { name: "TTD", description: "Time Travel Debugging - record and replay execution for debugging." },
      { name: "OllyDbg", description: "32-bit assembler level debugger for Windows. (Legacy, 2004-era — largely superseded by x64dbg. Only useful for old 32-bit malware that explicitly targets OllyDbg in anti-debug checks.)" },
      { name: "Immunity Debugger", description: "Debugger with Python API for exploit development." },
    ],
  },
  {
    name: "Delphi",
    tools: [
      { name: "IDR", description: "Interactive Delphi Reconstructor - tool for Delphi executable analysis.", projectUrl: "https://github.com/crypto2011/IDR" },
    ],
  },
  {
    name: "Disassemblers",
    tools: [
      { name: "Ghidra", description: "Software reverse engineering (SRE) suite of tools developed by NSA's Research Directorate.", projectUrl: "https://www.nsa.gov/ghidra" },
      { name: "IDA Pro", description: "Industry-standard interactive disassembler and debugger for reverse engineering.", projectUrl: "https://hex-rays.com/ida-pro/" },
      { name: "IDA Free", description: "Free version of IDA disassembler for non-commercial use." },
      { name: "Binary Ninja", description: "Binary analysis platform with modern UI and powerful scripting.", projectUrl: "https://binary.ninja/" },
      { name: "Cutter", description: "Free and open source RE platform powered by rizin/radare2.", projectUrl: "https://cutter.re/" },
      { name: "radare2", description: "Portable reversing framework for disassembly and debugging." },
      { name: "Hopper", description: "Reverse engineering tool for macOS and Linux disassembly." },
    ],
  },
  {
    name: "Documents",
    tools: [
      { name: "EZViewer", description: "Simple and fast document viewer for forensic analysis.", projectUrl: "https://ericzimmerman.github.io/" },
      { name: "OffVis", description: "Microsoft Office visualization tool for analyzing document structures." },
      { name: "oledump", description: "Tool to analyze OLE files (Office documents) for embedded macros.", projectUrl: "https://blog.didierstevens.com/programs/oledump-py/" },
      { name: "olevba", description: "Extract and analyze VBA macro source code from Office files." },
      { name: "OneNoteAnalyzer", description: "Tool for analyzing Microsoft OneNote files for forensic purposes." },
      { name: "pdf-parser", description: "Parse PDF documents to find elements used in attacks.", projectUrl: "https://blog.didierstevens.com/programs/pdf-tools/" },
      { name: "pdfid", description: "Scan PDF files to identify risky PDF keywords and features.", projectUrl: "https://blog.didierstevens.com/programs/pdf-tools/" },
      { name: "PDFStreamDumper", description: "GUI tool for analyzing PDFs with multiple decoders and scripts." },
      { name: "rtfdump", description: "Analyze RTF files for embedded objects and malicious content." },
      { name: "Didier Stevens Suite", description: "Collection of tools for document and malware analysis.", projectUrl: "https://blog.didierstevens.com/" },
    ],
  },
  {
    name: "dotNet",
    tools: [
      { name: "dnSpy", description: ".NET debugger and assembly editor for reverse engineering .NET apps.", projectUrl: "https://github.com/dnSpy/dnSpy" },
      { name: "dnSpyEx", description: "Actively maintained fork of dnSpy .NET debugger.", projectUrl: "https://github.com/dnSpyEx/dnSpy" },
      { name: "ILSpy", description: "Open-source .NET assembly browser and decompiler.", projectUrl: "https://github.com/icsharpcode/ILSpy" },
      { name: "de4dot", description: ".NET deobfuscator and unpacker supporting multiple obfuscators.", projectUrl: "https://github.com/de4dot/de4dot" },
      { name: "de4dot-cex", description: "Modified de4dot with ConfuserEx support." },
      { name: "dnlib", description: ".NET library for reading, writing, and creating .NET assemblies.", projectUrl: "https://github.com/0xd4d/dnlib" },
      { name: "CodeTrack", description: ".NET performance profiler for execution analysis.", projectUrl: "https://www.getcodetrack.com/" },
      { name: "DotDumper", description: "Tool to automatically dump .NET assemblies at runtime.", projectUrl: "https://github.com/GovanifY/DotDumper" },
      { name: "ExtremeDumper", description: "Dump .NET assembly memory to disk for analysis.", projectUrl: "https://github.com/wwh1004/ExtremeDumper" },
      { name: "GarbageMan", description: ".NET heap analysis tool for finding objects in memory." },
      { name: "NETReactorSlayer", description: ".NET Reactor deobfuscator for protected assemblies." },
      { name: "RunDotNetDll", description: "Execute .NET DLL methods from command line." },
      { name: "ConfuserEx", description: "Open-source protector/obfuscator for .NET applications." },
    ],
  },
  {
    name: "Exploitation",
    tools: [
      { name: "BadAssMacros", description: "Generate Office macro payloads for exploitation." },
      { name: "EvilClippy", description: "Tool for hiding malicious macros in Office documents." },
      { name: "DotNetToJScript", description: "Create JScript/VBScript to load .NET assemblies." },
      { name: "Egress-Assess", description: "Test egress data detection capabilities." },
      { name: "Exploit Development Tools", description: "Collection of tools for creating and testing exploits." },
    ],
  },
  {
    name: "File Information",
    tools: [
      { name: "DIE", description: "Detect It Easy - Determine file types and detect packers/protectors.", projectUrl: "https://github.com/horsicq/Detect-It-Easy" },
      { name: "Exeinfo PE", description: "Executable analyzer to detect packers, cryptors, and compilers.", projectUrl: "https://exeinfo-pe.en.uptodown.com/" },
      { name: "file", description: "Determine file type using magic numbers.", projectUrl: "https://www.darwinsys.com/file/" },
      { name: "FLOSS", description: "FLARE Obfuscated String Solver - Extract obfuscated strings from malware.", projectUrl: "https://github.com/mandiant/flare-floss" },
      { name: "HashMyFiles", description: "Calculate MD5/SHA1/SHA256 hashes of files.", projectUrl: "https://www.nirsoft.net/utils/hash_my_files.html" },
      { name: "Magika", description: "Google's AI-powered file type detection tool.", projectUrl: "https://github.com/google/magika" },
      { name: "TrID", description: "Identify file types from their binary signatures." },
      { name: "Yara", description: "Pattern matching tool for malware researchers.", projectUrl: "https://virustotal.github.io/yara/" },
      { name: "ssdeep", description: "Compute context triggered piecewise hashes (fuzzy hashing)." },
    ],
  },
  {
    name: "Forensic",
    tools: [
      { name: "Autopsy", description: "Digital forensics platform for hard drive investigation.", projectUrl: "https://www.autopsy.com/" },
      { name: "FTK Imager", description: "Data preview and imaging tool for forensic analysis.", projectUrl: "https://www.exterro.com/ftk-imager" },
      { name: "Arsenal Image Mounter", description: "Mount disk images as complete disks in Windows.", projectUrl: "https://arsenalrecon.com/" },
      { name: "Hayabusa", description: "Windows event log fast forensics timeline generator.", projectUrl: "https://github.com/Yamato-Security/hayabusa" },
      { name: "Chainsaw", description: "Rapid Windows forensic artifact searching tool.", projectUrl: "https://github.com/WithSecureLabs/chainsaw" },
      { name: "EvtxECmd", description: "Windows event log command line parser." },
      { name: "JumpListExplorer", description: "View and analyze Windows Jump List data." },
      { name: "MFTExplorer", description: "GUI application for viewing MFT file data." },
      { name: "AmcacheParser", description: "Parse Amcache.hve for program execution history." },
      { name: "AppCompatCacheParser", description: "Parse Application Compatibility Cache (Shimcache)." },
      { name: "ShellBagsExplorer", description: "Browse and analyze Windows ShellBags." },
      { name: "TimelineExplorer", description: "View timeline output from various forensic tools." },
      { name: "LECmd", description: "Link file (LNK) parser for forensic analysis." },
      { name: "PECmd", description: "Prefetch file parser for forensic analysis." },
      { name: "RBCmd", description: "Recycle Bin parser for forensic analysis." },
      { name: "SBECmd", description: "ShellBags Explorer command line version." },
      { name: "WxTCmd", description: "Windows Timeline database parser." },
      { name: "Event Log Explorer", description: "View and analyze Windows event logs efficiently." },
      { name: "ALEAPP", description: "Android Logs Events And Protobuf Parser." },
      { name: "ILEAPP", description: "iOS Logs Events And Plists Parser." },
    ],
  },
  {
    name: "Go",
    tools: [
      { name: "GoReSym", description: "Extract function/type information from Go binaries.", projectUrl: "https://github.com/mandiant/GoReSym" },
      { name: "GoStringUngarbler", description: "Deobfuscate strings from garbled Go binaries." },
      { name: "Redress", description: "Analyze Go compiled binaries." },
    ],
  },
  {
    name: "Hex Editors",
    tools: [
      { name: "010 Editor", description: "Professional hex editor with binary templates and scripting.", projectUrl: "https://www.sweetscape.com/010editor/" },
      { name: "HxD", description: "Fast and free hex editor for Windows.", projectUrl: "https://mh-nexus.de/en/hxd/" },
      { name: "ImHex", description: "Feature-rich hex editor with pattern language support.", projectUrl: "https://github.com/WerWolv/ImHex" },
      { name: "wxHexEditor", description: "Cross-platform hex editor with large file support." },
    ],
  },
  {
    name: "IDA Plugins",
    tools: [
      { name: "BinDiff", description: "Binary comparison tool for finding code differences.", projectUrl: "https://www.zynamics.com/bindiff.html" },
      { name: "CAPA IDA", description: "Capa integration for IDA Pro." },
      { name: "IDAPython", description: "Python scripting plugin for IDA Pro." },
      { name: "Lighthouse", description: "Code coverage explorer for IDA Pro." },
      { name: "FLIRT Signatures", description: "Fast Library Identification and Recognition Technology." },
    ],
  },
  {
    name: "InnoSetup",
    tools: [
      { name: "ifpsdasm", description: "Inno Setup Pascal Script disassembler." },
      { name: "Inno Setup Decompiler", description: "Decompile Inno Setup installer scripts." },
      { name: "innoextract", description: "Extract files from Inno Setup installers.", projectUrl: "https://constexpr.org/innoextract/" },
      { name: "innounp", description: "Inno Setup unpacker for extracting files." },
    ],
  },
  {
    name: "Java and Android",
    tools: [
      { name: "APKTool", description: "Reverse engineer Android APK files.", projectUrl: "https://apktool.org/" },
      { name: "Bytecode Viewer", description: "Java/Android decompiler and debugger.", projectUrl: "https://github.com/Konloch/bytecode-viewer" },
      { name: "dex2jar", description: "Convert Android DEX files to JAR.", projectUrl: "https://github.com/pxb1988/dex2jar" },
      { name: "JD-GUI", description: "Java decompiler with graphical interface.", projectUrl: "https://java-decompiler.github.io/" },
      { name: "Jadx", description: "DEX to Java decompiler with GUI.", projectUrl: "https://github.com/skylot/jadx" },
      { name: "Recaf", description: "Modern Java bytecode editor.", projectUrl: "https://github.com/Col-E/Recaf" },
      { name: "Procyon", description: "Java decompiler with improved generics support." },
      { name: "CFR", description: "Java decompiler supporting modern language features." },
    ],
  },
  {
    name: "Javascript",
    tools: [
      { name: "js-beautify", description: "Beautify and format JavaScript, HTML, and CSS.", projectUrl: "https://beautifier.io/" },
      { name: "js-deobfuscator", description: "Deobfuscate JavaScript protected with obfuscator.io." },
      { name: "malware-jail", description: "Sandbox for semi-automatic JavaScript malware analysis.", projectUrl: "https://github.com/nicholasgcoles/malware-jail" },
      { name: "obfuscator-io-deobfuscator", description: "Deobfuscator for obfuscator.io protected code." },
      { name: "box-js", description: "A tool for studying JavaScript malware.", projectUrl: "https://github.com/nicholasgcoles/box-js" },
    ],
  },
  {
    name: "Lateral Movement",
    tools: [
      { name: "BloodHound", description: "Active Directory attack path visualization tool.", projectUrl: "https://bloodhound.io/" },
      { name: "AzureHound", description: "Azure/AzureAD data collector for BloodHound." },
      { name: "SharpHound", description: "C# data collector for BloodHound." },
      { name: "Impacket", description: "Python collection for working with network protocols." },
      { name: "NetExec (nxc)", description: "Post-exploitation tool for network pentesting — actively maintained successor to CrackMapExec (cme).", projectUrl: "https://github.com/Pennyw0rth/NetExec" },
      { name: "CrackMapExec", description: "Post-exploitation tool for network pentesting. (Deprecated — replaced by NetExec. Use nxc instead.)" },
      { name: "Evil-WinRM", description: "WinRM shell for remote command execution." },
    ],
  },
  {
    name: "Memory",
    tools: [
      { name: "hollows_hunter", description: "Detect and dump hollowed/injected processes.", projectUrl: "https://github.com/hasherezade/hollows_hunter" },
      { name: "pe-sieve", description: "Detect malware running in processes via memory scanning.", projectUrl: "https://github.com/hasherezade/pe-sieve" },
      { name: "Process Dump", description: "Dump memory from processes (32/64 bit)." },
      { name: "Volatility3", description: "Advanced memory forensics framework.", projectUrl: "https://github.com/volatilityfoundation/volatility3" },
      { name: "MemProcFS", description: "Memory process file system for analysis.", projectUrl: "https://github.com/ufrisk/MemProcFS" },
      { name: "WinPmem", description: "Physical memory acquisition tool for Windows." },
    ],
  },
  {
    name: "Networking",
    tools: [
      { name: "FakeNet-NG", description: "Dynamic network analysis tool for malware.", projectUrl: "https://github.com/mandiant/flare-fakenet-ng" },
      { name: "INetSim", description: "Internet services simulation suite for malware analysis — simulates DNS, HTTP, SMTP, FTP and more in an isolated lab environment.", projectUrl: "https://www.inetsim.org/" },
      { name: "Fiddler", description: "Web debugging proxy for HTTP/HTTPS traffic.", projectUrl: "https://www.telerik.com/fiddler" },
      { name: "Wireshark", description: "Network protocol analyzer for traffic capture.", projectUrl: "https://www.wireshark.org/" },
      { name: "tshark", description: "Command-line network protocol analyzer." },
      { name: "NetworkMiner", description: "Network forensic analyzer for PCAP files." },
      { name: "PuTTY", description: "SSH and Telnet client for remote connections.", projectUrl: "https://www.putty.org/" },
      { name: "OpenVPN", description: "Open source VPN solution.", projectUrl: "https://openvpn.net/" },
      { name: "telnet", description: "Telnet client for network testing." },
      { name: "WinDump", description: "Windows port of tcpdump for packet capture." },
      { name: "internet_detector", description: "Detect network connectivity status." },
      { name: "Burp Suite Community", description: "Web application security testing platform.", projectUrl: "https://portswigger.net/burp/communitydownload" },
    ],
  },
  {
    name: "Packers",
    tools: [
      { name: "asar", description: "Extract and pack Electron ASAR archives.", projectUrl: "https://github.com/electron/asar" },
      { name: "autoit-ripper", description: "Extract AutoIt scripts from compiled executables." },
      { name: "pkg-unpacker", description: "Unpack Node.js pkg executables." },
      { name: "UniExtract2", description: "Universal extractor for many archive formats.", projectUrl: "https://github.com/Bioruebe/UniExtract2" },
      { name: "UPX", description: "Ultimate Packer for eXecutables.", projectUrl: "https://upx.github.io/" },
      { name: "DebugView++", description: "Log OutputDebugString from packed/protected apps." },
    ],
  },
  {
    name: "Payload Development",
    tools: [
      { name: "msfvenom", description: "Payload generator from Metasploit Framework." },
      { name: "Donut", description: "Shellcode generation tool for .NET assemblies." },
      { name: "ScareCrow", description: "Payload creation framework for EDR bypass." },
      { name: "C3", description: "Custom Command and Control framework.", projectUrl: "https://github.com/WithSecureLabs/C3" },
    ],
  },
  {
    name: "PE",
    tools: [
      { name: "CFF Explorer", description: "PE editor with header, section, and resource editing.", projectUrl: "https://ntcore.com/?page_id=388" },
      { name: "Dependency Walker", description: "Display module dependency tree for executables." },
      { name: "dll_to_exe", description: "Convert DLL to EXE for analysis." },
      { name: "PE Detective", description: "Detect packers and compilers used in PE files." },
      { name: "PE-bear", description: "Portable Executable parsing tool with GUI.", projectUrl: "https://github.com/hasherezade/pe-bear" },
      { name: "PEiD", description: "Detect packers, cryptors, and compilers in PE files." },
      { name: "pestudio", description: "Static malware analysis for PE files.", projectUrl: "https://www.winitor.com/" },
      { name: "pe_unmapper", description: "Convert memory-mapped PE to file alignment." },
      { name: "Task Explorer", description: "Task manager with PE analysis features." },
      { name: "Explorer Suite", description: "Suite of PE analysis tools including CFF Explorer." },
      { name: "ResourceHacker", description: "Resource editor for Windows executables.", projectUrl: "http://www.angusj.com/resourcehacker/" },
      { name: "Scylla", description: "IAT (Import Address Table) fixer for manually unpacked PE files — reconstructs the import table after OEP dumping.", projectUrl: "https://github.com/NtQuery/Scylla" },
    ],
  },
  {
    name: "Persistence",
    tools: [
      { name: "Autoruns", description: "View and manage auto-starting programs.", projectUrl: "https://docs.microsoft.com/en-us/sysinternals/downloads/autoruns" },
      { name: "RegRipper", description: "Extract and analyze data from Windows Registry." },
      { name: "WMI Explorer", description: "View and query WMI objects for persistence." },
    ],
  },
  {
    name: "Privilege Escalation",
    tools: [
      { name: "WinPEAS", description: "Windows Privilege Escalation Awesome Scripts." },
      { name: "PowerUp", description: "PowerShell tool for privilege escalation vectors." },
      { name: "Seatbelt", description: "C# project for security-oriented host-survey." },
      { name: "SharpUp", description: "C# port of PowerUp for privilege escalation." },
      { name: "Watson", description: "Enumerate missing KBs for privilege escalation." },
    ],
  },
  {
    name: "Productivity Tools",
    tools: [
      { name: "7-Zip", description: "Open-source file archiver with high compression ratio.", projectUrl: "https://www.7-zip.org/" },
      { name: "Cmder", description: "Portable console emulator for Windows.", projectUrl: "https://cmder.app/" },
      { name: "Cygwin", description: "Linux-like environment for Windows.", projectUrl: "https://www.cygwin.com/" },
      { name: "IPython", description: "Enhanced interactive Python shell." },
      { name: "MSVC Build Tools", description: "Microsoft Visual C++ Build Tools for development." },
      { name: "NASM", description: "Netwide Assembler for x86 assembly.", projectUrl: "https://www.nasm.us/" },
      { name: "Notepad++", description: "Powerful source code editor for Windows.", projectUrl: "https://notepad-plus-plus.org/" },
      { name: "Tor Browser", description: "Browser for anonymous web browsing via Tor network.", projectUrl: "https://www.torproject.org/" },
      { name: "VS Code", description: "Lightweight but powerful source code editor.", projectUrl: "https://code.visualstudio.com/" },
      { name: "Windows Terminal", description: "Modern terminal application for Windows.", projectUrl: "https://github.com/microsoft/terminal" },
      { name: "Git", description: "Distributed version control system." },
      { name: "Python", description: "Versatile programming language for scripting." },
      { name: "NodeJS", description: "JavaScript runtime for server-side scripting." },
    ],
  },
  {
    name: "Python",
    tools: [
      { name: "pycdas", description: "Python bytecode disassembler." },
      { name: "pycdc", description: "Python bytecode decompiler (Decompyle++).", projectUrl: "https://github.com/zrax/pycdc" },
      { name: "uncompyle6", description: "Python bytecode decompiler for Python 2.7/3.x." },
      { name: "unpyc3", description: "Python 3 bytecode decompiler." },
      { name: "angr", description: "Binary analysis framework using symbolic execution.", projectUrl: "https://angr.io/" },
      { name: "pefile", description: "Python module for parsing PE files." },
      { name: "Capstone", description: "Multi-architecture disassembly framework." },
      { name: "Unicorn", description: "CPU emulator framework based on QEMU." },
    ],
  },
  {
    name: "Reconnaissance",
    tools: [
      { name: "ADExplorer", description: "Active Directory Explorer for viewing and editing AD.", projectUrl: "https://docs.microsoft.com/en-us/sysinternals/downloads/adexplorer" },
      { name: "ADRecon", description: "Active Directory reconnaissance tool." },
      { name: "Nmap", description: "Network scanner for security auditing.", projectUrl: "https://nmap.org/" },
      { name: "PowerView", description: "PowerShell tool for AD network situational awareness." },
      { name: "Responder", description: "LLMNR, NBT-NS and MDNS poisoner." },
    ],
  },
  {
    name: "Registry",
    tools: [
      { name: "RegCool", description: "Advanced registry editor for Windows.", projectUrl: "https://kurtzimmermann.com/regcoolext_en.html" },
      { name: "Regshot", description: "Compare registry snapshots before/after changes.", projectUrl: "https://github.com/Seabreg/Regshot" },
      { name: "reg_export", description: "Export specific registry keys/values." },
      { name: "Registry Viewer", description: "View and analyze Windows Registry hives." },
      { name: "RECmd", description: "Command line registry explorer." },
    ],
  },
  {
    name: "Shellcode",
    tools: [
      { name: "blobrunner", description: "Quickly debug shellcode by allocating and executing it.", projectUrl: "https://github.com/OALabs/BlobRunner" },
      { name: "blobrunner64", description: "64-bit version of BlobRunner for x64 shellcode." },
      { name: "scdbg", description: "Shellcode analysis and debugging tool.", projectUrl: "http://sandsprite.com/blogs/index.php?uid=7&pid=152" },
      { name: "scdbg_gui", description: "GUI version of scdbg for shellcode analysis." },
      { name: "SCLauncher", description: "Run and debug shellcode easily." },
      { name: "SCLauncher64", description: "64-bit shellcode launcher." },
      { name: "shellcode_launcher", description: "Simple shellcode launcher utility." },
      { name: "jmp2it", description: "Jump to shellcode in a file for debugging." },
      { name: "speakeasy", description: "Windows kernel and user mode emulation.", projectUrl: "https://github.com/mandiant/speakeasy" },
    ],
  },
  {
    name: "Utilities",
    tools: [
      { name: "API Monitor", description: "Monitor and control API calls in applications.", projectUrl: "http://www.rohitab.com/apimonitor" },
      { name: "capa", description: "Identify capabilities in executable files.", projectUrl: "https://github.com/mandiant/capa" },
      { name: "capa Explorer Web", description: "Web interface for capa results." },
      { name: "CryptoTester", description: "Tool for testing cryptographic operations." },
      { name: "CyberChef", description: "Web app for encoding, encryption, compression and data analysis.", projectUrl: "https://gchq.github.io/CyberChef/" },
      { name: "Malcode Analyst Pack", description: "Collection of malware analysis tools." },
      { name: "Process Explorer", description: "Advanced process viewer and manager.", projectUrl: "https://docs.microsoft.com/en-us/sysinternals/downloads/process-explorer" },
      { name: "Process Monitor", description: "Monitor file, Registry, and process activity.", projectUrl: "https://docs.microsoft.com/en-us/sysinternals/downloads/procmon" },
      { name: "ProcDOT", description: "Visual malware analysis tool for ProcMon logs.", projectUrl: "https://www.procdot.com/" },
      { name: "rat-king-parser", description: "Parse config from common RAT families." },
      { name: "Frida", description: "Dynamic instrumentation toolkit — inject JS into native apps at runtime for hooking, tracing, and reverse engineering.", projectUrl: "https://frida.re/" },
      { name: "Sysinternals Suite", description: "Collection of Windows system utilities.", projectUrl: "https://docs.microsoft.com/en-us/sysinternals/" },
      { name: "System Informer", description: "Advanced system process manager (formerly Process Hacker).", projectUrl: "https://systeminformer.sourceforge.io/" },
      { name: "CAPEv2", description: "Malware sandbox for automated analysis.", projectUrl: "https://github.com/kevoreilly/CAPEv2" },
      { name: "CapeSolo", description: "Standalone CAPE behavioral analysis.", projectUrl: "https://github.com/kevoreilly/capesolo" },
    ],
  },
  {
    name: "Visual Basic",
    tools: [
      { name: "VB Decompiler", description: "Decompiler for Visual Basic 5.0/6.0 programs.", projectUrl: "https://www.vb-decompiler.org/" },
      { name: "vbdec", description: "Visual Basic P-Code disassembler." },
    ],
  },
  {
    name: "Web Application",
    tools: [
      { name: "Burp Suite", description: "Integrated platform for web security testing.", projectUrl: "https://portswigger.net/burp" },
      { name: "OWASP ZAP", description: "Open-source web application security scanner.", projectUrl: "https://www.zaproxy.org/" },
      { name: "sqlmap", description: "Automatic SQL injection and takeover tool." },
      { name: "Nikto", description: "Web server vulnerability scanner." },
      { name: "Dirb", description: "Web content scanner for hidden resources." },
    ],
  },
  {
    name: "Wordlists",
    tools: [
      { name: "SecLists", description: "Security tester's companion - collection of multiple wordlists.", projectUrl: "https://github.com/danielmiessler/SecLists" },
      { name: "RockYou", description: "Popular password wordlist from the RockYou breach." },
      { name: "PayloadsAllTheThings", description: "List of payloads for bypass and exploitation.", projectUrl: "https://github.com/swisskyrepo/PayloadsAllTheThings" },
    ],
  },
];

// Get the latest tools data version number for comparison
export const TOOLS_DATA_VERSION = "2026.03.28";
