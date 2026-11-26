// StarPanel Bridge: sends one bounded chord only to the foreground StarCitizen process.
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading;
class Keyboard {
  [StructLayout(LayoutKind.Sequential)] struct MOUSEINPUT {public int dx,dy;public uint mouseData,dwFlags,time;public UIntPtr extra;}
  [StructLayout(LayoutKind.Sequential)] struct KEYBDINPUT {public ushort vk,scan;public uint flags,time;public UIntPtr extra;}
  [StructLayout(LayoutKind.Explicit)] struct UNION {[FieldOffset(0)]public MOUSEINPUT mouse;[FieldOffset(0)]public KEYBDINPUT key;}
  [StructLayout(LayoutKind.Sequential)] struct INPUT {public uint type;public UNION value;}
  [DllImport("user32.dll")] static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr hwnd,out uint pid);
  [DllImport("user32.dll",SetLastError=true)] static extern uint SendInput(uint count,INPUT[] inputs,int size);
  static bool GameFocused(){uint pid;GetWindowThreadProcessId(GetForegroundWindow(),out pid);try{return Process.GetProcessById((int)pid).ProcessName.Equals("StarCitizen",StringComparison.OrdinalIgnoreCase);}catch{return false;}}
  static void Send(int code,bool up){var input=new INPUT{type=1,value=new UNION{key=new KEYBDINPUT{scan=(ushort)(code&255),flags=(uint)(8|((code&256)!=0?1:0)|(up?2:0))}}};if(SendInput(1,new[]{input},Marshal.SizeOf(typeof(INPUT)))!=1)throw new Exception("Windows rejected keyboard input");}
  static int Main(string[] args){int pressed=0;int[] codes=new int[args.Length];try{
    if(args.Length==1&&args[0]=="--self-test"){if(Marshal.SizeOf(typeof(INPUT))!=(IntPtr.Size==8?40:28))throw new Exception("Invalid native INPUT size");Console.WriteLine("SELF_TEST_OK");return 0;}
    if(args.Length<1||args.Length>4)throw new Exception("Invalid chord");
    for(int i=0;i<args.Length;i++)if(!int.TryParse(args[i],out codes[i])||codes[i]<1||codes[i]>511)throw new Exception("Invalid scan code");
    if(!GameFocused())throw new Exception("Focus Star Citizen before pressing a panel button");
    try{for(int i=0;i<codes.Length;i++){if(!GameFocused())throw new Exception("Star Citizen lost focus");Send(codes[i],false);pressed++;}Thread.Sleep(60);}
    finally{for(int i=pressed-1;i>=0;i--)Send(codes[i],true);}
    Console.WriteLine("SENT");return 0;
  }catch(Exception e){Console.Error.WriteLine(e.Message);return 1;}}
}
